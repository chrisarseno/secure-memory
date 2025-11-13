import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import pino from "pino";
import pinoHttp from "pino-http";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";
import { DatabaseStorage } from "./database-storage";
import { createRoutes } from "./routes";
import { setupVite } from "./vite";
import { LocalNEXUSSystem } from "./sage/local-sage-system";
import { ConsciousnessBridge } from "./consciousness-bridge";
import { AICollaborationSystem } from "./ai-collaboration-system";
import { setupAuth, sessionMiddleware } from "./auth";
import { DistributedConsciousnessSystem } from "./distributed";
import { cache } from "./cache";
import { closeDatabasePool } from "./db";
import { initializeSentry, setupSentryMiddleware, setupSentryErrorHandler } from "./sentry";
import { metricsMiddleware } from "./middleware/metrics";
import { updateConsciousnessMetrics, websocketConnectionsActive } from "./metrics";
import { wrapMiddleware, requireWebSocketAuth, getSocketUser } from "./lib/websocket-auth";

// Initialize Sentry FIRST (before any other code)
const sentryEnabled = initializeSentry();

// Initialize structured logging with validated config
const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  } : undefined, // JSON in production
});

const app = express();

// Sentry request handler (must be first middleware)
if (sentryEnabled) {
  setupSentryMiddleware(app);
}
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Security: Limit message size to prevent memory exhaustion
  maxHttpBufferSize: 1024 * 1024, // 1MB max message size
  // Connection timeout
  connectTimeout: 45000, // 45 seconds
  // Ping configuration for connection health
  pingTimeout: 30000,
  pingInterval: 25000,
});

const storage = new DatabaseStorage();
const localNexusSystem = new LocalNEXUSSystem(storage);
const consciousnessBridge = new ConsciousnessBridge(storage);
const collaborationSystem = new AICollaborationSystem(localNexusSystem.getAIService(), consciousnessBridge);

// Initialize Distributed Consciousness System
const distributedSystem = new DistributedConsciousnessSystem(
  {
    nodeId: `nexus-${uuidv4()}`,
    address: '0.0.0.0',
    port: 5001, // Different port for node communication
    capabilities: ['consciousness-processing', 'ai-collaboration', 'multi-modal-processing'],
    consciousnessModules: [
      'global_workspace',
      'social_cognition',
      'temporal_consciousness',
      'value_learning',
      'virtue_learning',
      'creative_intelligence',
      'consciousness_core',
      'consciousness_manager',
      'safety_monitor'
    ],
    computeCapacity: 100,
    region: 'local'
  },
  consciousnessBridge,
  storage
);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow Vite in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Vite HMR
}));

// Rate limiting for API routes (configured from env)
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Request correlation IDs for distributed tracing
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Prometheus metrics tracking
app.use(metricsMiddleware);

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Request logging with correlation IDs
app.use(pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.id,
  }),
}));

// Enable response compression
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Compression level (0-9)
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup authentication
setupAuth(app);

// API Routes MUST come before static serving to avoid conflicts
app.use(createRoutes(storage, localNexusSystem, collaborationSystem, distributedSystem));

// Sentry error handler (must be after all routes, before error handlers)
if (sentryEnabled) {
  setupSentryErrorHandler(app);
}

// Serve frontend - Vite in development, static files in production
if (process.env.NODE_ENV === "production") {
  // Serve built static files in production
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  // Serve index.html for all non-API routes (SPA routing)
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  setupVite(app, server);
}

// Enhanced Socket.IO for real-time collaboration and monitoring
const connectedClients = new Map<string, { userId: string | null; subscriptions: Set<string> }>();

// WebSocket authentication middleware
// Step 1: Share Express session with Socket.IO
io.use(wrapMiddleware(sessionMiddleware));

// Step 2: Require authentication for WebSocket connections
io.use(requireWebSocketAuth);

io.on("connection", (socket) => {
  const user = getSocketUser(socket);

  if (!user) {
    // This should never happen due to requireWebSocketAuth, but handle it anyway
    logger.error({ socketId: socket.id }, '❌ Authenticated socket has no user data');
    socket.disconnect(true);
    return;
  }

  logger.info({
    socketId: socket.id,
    userId: user.id,
    username: user.username
  }, '🔗 Authenticated client connected to NEXUS');

  // Initialize client state with authenticated user
  connectedClients.set(socket.id, {
    userId: user.id,
    subscriptions: new Set()
  });

  // Send initial connection data
  socket.emit("nexus-update", {
    type: "connection",
    message: `Connected to NEXUS Unified System as ${user.username}`,
    user: {
      id: user.id,
      username: user.username,
    },
    capabilities: [
      "consciousness_monitoring",
      "collaborative_learning",
      "knowledge_sharing",
      "multi_modal_processing",
      "real_time_metrics"
    ]
  });

  // Subscribe to consciousness monitoring
  socket.on("subscribe-consciousness", () => {
    const client = connectedClients.get(socket.id);
    if (client?.userId) {
      client.subscriptions.add("consciousness");
      socket.join("consciousness-monitoring");
      socket.emit("subscription-confirmed", { type: "consciousness" });
      console.log(`📡 Client ${socket.id} subscribed to consciousness monitoring`);
    } else {
      socket.emit("auth-required", { message: "Authentication required for consciousness monitoring" });
    }
  });

  // Subscribe to learning system updates
  socket.on("subscribe-learning", () => {
    const client = connectedClients.get(socket.id);
    if (client?.userId) {
      client.subscriptions.add("learning");
      socket.join("learning-updates");
      socket.emit("subscription-confirmed", { type: "learning" });
      console.log(`🧠 Client ${socket.id} subscribed to learning updates`);
    } else {
      socket.emit("auth-required", { message: "Authentication required for learning updates" });
    }
  });

  // Collaborative query processing
  socket.on("collaborative-query", async (data) => {
    const client = connectedClients.get(socket.id);
    if (!client?.userId) {
      socket.emit("auth-required", { message: "Authentication required for collaborative queries" });
      return;
    }

    try {
      console.log(`🤝 Processing collaborative query from ${client.userId}`);
      
      // Process with local AI system
      const aiService = localNexusSystem.getAIService();
      const result = await aiService.generateResponse(
        data.query, 
        'collaborative', 
        data.temperature || 0.7, 
        data.maxTokens || 800
      );

      socket.emit("collaborative-response", {
        queryId: data.queryId,
        response: result.content,
        confidence: result.confidence,
        model: result.model,
        processingTime: result.generationTimeMs,
        timestamp: Date.now()
      });

      // Broadcast to other authenticated collaborators if requested
      if (data.shareWithOthers) {
        socket.to("consciousness-monitoring").emit("shared-query-result", {
          fromUser: client.userId,
          query: data.query.substring(0, 100) + (data.query.length > 100 ? '...' : ''),
          response: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
          timestamp: Date.now()
        });
      }
    } catch (error) {
      socket.emit("query-error", {
        message: "Failed to process collaborative query",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Knowledge contribution system
  socket.on("contribute-knowledge", async (data) => {
    const client = connectedClients.get(socket.id);
    if (!client?.userId) {
      socket.emit("auth-required", { message: "Authentication required for knowledge contributions" });
      return;
    }

    try {
      console.log(`📚 Knowledge contribution from ${client.userId}`);
      
      // Add knowledge to the system
      const knowledgeNode = await localNexusSystem.addKnowledge(
        data.content,
        data.type || 'user_contribution',
        { 
          contributedBy: client.userId,
          contributionTimestamp: new Date(),
          confidence: data.confidence || 0.8,
          ...data.metadata 
        },
        data.sources || []
      );

      socket.emit("knowledge-accepted", {
        nodeId: knowledgeNode.id,
        message: "Knowledge contribution successfully integrated",
        impact: "Knowledge graph updated with new insights"
      });

      // Notify other collaborators
      socket.to("consciousness-monitoring").emit("knowledge-shared", {
        fromUser: client.userId,
        content: data.content.substring(0, 150) + (data.content.length > 150 ? '...' : ''),
        type: data.type,
        timestamp: Date.now()
      });
    } catch (error) {
      socket.emit("contribution-error", {
        message: "Failed to process knowledge contribution",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Consciousness sharing protocol
  socket.on("share-consciousness", async (data) => {
    const client = connectedClients.get(socket.id);
    if (!client?.userId) {
      socket.emit("auth-required", { message: "Authentication required for consciousness sharing" });
      return;
    }

    try {
      console.log(`🧠 Consciousness share initiated by ${client.userId}`);
      
      // Create consciousness snapshot for sharing
      const snapshot = await localNexusSystem.createConsciousnessSnapshot(
        `Collaboration share by ${client.userId} - ${data.description || 'Real-time consciousness state'}`
      );

      // Broadcast to collaborators
      socket.to("consciousness-monitoring").emit("consciousness-shared", {
        fromUser: client.userId,
        snapshotId: snapshot.id,
        consciousnessLevel: snapshot.metadata.consciousnessLevel,
        insights: data.insights || [],
        sharedAt: Date.now()
      });

      socket.emit("consciousness-share-complete", {
        message: "Consciousness state shared with collaborators",
        snapshotId: snapshot.id
      });
    } catch (error) {
      socket.emit("share-error", {
        message: "Failed to share consciousness",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI-to-AI Collaboration Handlers
  socket.on("ai-collaboration-request", async (data) => {
    const client = connectedClients.get(socket.id);
    if (!client?.userId) {
      socket.emit("auth-required", { message: "Authentication required for AI collaboration" });
      return;
    }

    try {
      const { from, to, type, content, priority } = data;
      const collaborationId = await collaborationSystem.initiateCollaboration({
        from: from || client.userId,
        to,
        type,
        content,
        priority: priority || 'medium'
      });

      socket.emit("collaboration-initiated", { collaborationId, status: 'active' });
      
      // Note: Socket.IO client added for real-time collaboration updates
      // collaborationSystem.addClient(socket); // Temporarily disabled due to type mismatch"
      
    } catch (error) {
      socket.emit("collaboration-error", {
        message: "Failed to initiate AI collaboration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  socket.on("distributed-problem-solve", async (data) => {
    const client = connectedClients.get(socket.id);
    if (!client?.userId) {
      socket.emit("auth-required", { message: "Authentication required for distributed problem solving" });
      return;
    }

    try {
      const coordinationId = await collaborationSystem.initiateDistributedProblemSolving(data.problem);
      
      socket.emit("problem-solving-started", { 
        coordinationId, 
        status: 'coordinating',
        message: 'Distributed AI problem solving initiated' 
      });
      
    } catch (error) {
      socket.emit("problem-solving-error", {
        message: "Failed to start distributed problem solving",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  socket.on("disconnect", () => {
    connectedClients.delete(socket.id);
    console.log("🔌 Client disconnected from NEXUS collaboration system:", socket.id);
  });
});

// Real-time consciousness metrics from actual AI systems
setInterval(async () => {
  try {
    // Get real system metrics from AI components
    const aiSystemMetrics = await localNexusSystem.getLocalMetrics();
    const curriculumMetrics = await localNexusSystem.getCurriculumMetrics();
    const safetyMetrics = await localNexusSystem.getReputationMetrics();
    const collaborationMetrics = collaborationSystem?.getSystemMetrics ? collaborationSystem.getSystemMetrics() : null;
    
    // Calculate real consciousness coherence from module integration levels
    const modules = await storage.getModules();
    const avgIntegration = modules.reduce((sum, mod) => sum + mod.integrationLevel, 0) / modules.length;
    const moduleHealthScore = modules.filter(mod => mod.status === 'active').length / modules.length * 100;
    
    // Real consciousness coherence based on module integration and health
    const consciousnessCoherence = (avgIntegration + moduleHealthScore) / 2;
    
    // Real creative intelligence from AI model performance and request success
    const creativeIntelligence = Math.min(100, 
      (aiSystemMetrics.readyModels / Math.max(1, aiSystemMetrics.totalModels)) * 60 +
      Math.min(40, aiSystemMetrics.totalRequests * 0.1));
    
    // Real safety compliance from source reputation and reliability
    const safetyCompliance = Math.min(100, 
      (safetyMetrics.highReputationSources / Math.max(1, safetyMetrics.totalSources)) * 100);
    
    // Real learning efficiency from curriculum engine metrics
    const learningEfficiency = Math.min(100,
      curriculumMetrics ? curriculumMetrics.learningEfficiency * 100 : 75);
    
    // Real cost per hour from actual compute usage
    const realCostPerHour = aiSystemMetrics.totalComputeCost > 0 
      ? localNexusSystem.getHourlyCostRate()
      : 0.05; // Base rate when idle
    
    // Count actually online modules
    const modulesOnline = modules.filter(mod => mod.status === 'active').length;
    
    const newMetrics = {
      consciousnessCoherence: Math.round(consciousnessCoherence * 10) / 10,
      creativeIntelligence: Math.round(creativeIntelligence * 10) / 10,
      safetyCompliance: Math.round(safetyCompliance * 10) / 10,
      learningEfficiency: Math.round(learningEfficiency * 10) / 10,
      costPerHour: Math.round(realCostPerHour * 100) / 100,
      modulesOnline,
      totalModules: modules.length,
    };

    await storage.addMetrics(newMetrics);

    // Update Prometheus metrics
    updateConsciousnessMetrics({
      coherence: newMetrics.consciousnessCoherence,
      creativeIntelligence: newMetrics.creativeIntelligence,
      safetyCompliance: newMetrics.safetyCompliance,
      learningEfficiency: newMetrics.learningEfficiency,
      modulesOnline: newMetrics.modulesOnline,
      totalModules: newMetrics.totalModules,
      costPerHour: newMetrics.costPerHour,
    });

    // Update WebSocket connection metrics
    const authenticatedConnections = Array.from(connectedClients.values()).filter(c => c.userId).length;
    const unauthenticatedConnections = connectedClients.size - authenticatedConnections;
    websocketConnectionsActive.set({ authenticated: 'true' }, authenticatedConnections);
    websocketConnectionsActive.set({ authenticated: 'false' }, unauthenticatedConnections);

    // Broadcast to all connected clients
    io.emit("metrics-update", newMetrics);

    // Add activities based on actual AI system performance
    if (aiSystemMetrics.totalRequests > 0) {
      const avgResponseTime = aiSystemMetrics.avgResponseTime;
      if (avgResponseTime < 2) {
        const activity = await storage.addActivity({
          type: "knowledge" as const,
          message: `AI system processed ${aiSystemMetrics.totalRequests} requests with ${avgResponseTime.toFixed(1)}s avg response`,
          moduleId: "local_ai_service"
        });
        io.emit("activity-update", activity);
      }
    }

    // Add collaboration system metrics if available
    if (collaborationMetrics && collaborationMetrics.tasksCompleted > 0) {
      const collabActivity = await storage.addActivity({
        type: "social" as const,
        message: `AI agents completed ${collaborationMetrics.tasksCompleted} collaborative tasks`,
        moduleId: "ai_collaboration"
      });
      io.emit("activity-update", collabActivity);
    }

    // Add curriculum learning progress
    if (curriculumMetrics && curriculumMetrics.gapsResolved > 0) {
      const learningActivity = await storage.addActivity({
        type: "creative" as const,
        message: `Learning system resolved ${curriculumMetrics.gapsResolved} knowledge gaps (${(curriculumMetrics.learningEfficiency * 100).toFixed(1)}% efficiency)`,
        moduleId: "curriculum_engine"
      });
      io.emit("activity-update", learningActivity);
    }

  } catch (error) {
    console.error("Error in real-time update:", error);
  }
}, 5000); // Update every 5 seconds

// Initialize consciousness bridge
consciousnessBridge.initialize();

// Start autonomous NEXUS learning with local models
logger.info('🤖 Local NEXUS System initialized');

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`🚀 NEXUS (NEXUS Unified System) running on http://0.0.0.0:${env.PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔒 Security: Helmet enabled, Rate limiting active`);
  logger.info(`📝 Logging level: ${env.LOG_LEVEL}`);
  logger.info(`💰 Local compute cost tracking enabled`);
  logger.info(`🏠 100% Local AI - No external dependencies`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('✅ HTTP server closed');

    try {
      // Give active requests time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Close Redis connection
      await cache.close();

      // Close database connection pool
      await closeDatabasePool();

      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});
