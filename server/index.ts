import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import { DatabaseStorage } from "./database-storage";
import { createRoutes } from "./routes";
import { setupVite } from "./vite";
import { LocalNEXUSSystem } from "./sage/local-sage-system";
import { ConsciousnessBridge } from "./consciousness-bridge";
import { AICollaborationSystem } from "./ai-collaboration-system";
import { setupAuth } from "./auth";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const storage = new DatabaseStorage();
const localNexusSystem = new LocalNEXUSSystem(storage);
const consciousnessBridge = new ConsciousnessBridge(storage);
const collaborationSystem = new AICollaborationSystem(localNexusSystem.localAI, consciousnessBridge);

app.use(cors());
app.use(express.json());

// Setup authentication
setupAuth(app);

// API Routes MUST come before static serving to avoid conflicts
app.use(createRoutes(storage, localNexusSystem, collaborationSystem));

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

io.on("connection", (socket) => {
  console.log("🔗 Client connected to NEXUS collaboration system:", socket.id);
  
  // Initialize client state
  connectedClients.set(socket.id, { userId: null, subscriptions: new Set() });

  // Send initial connection data
  socket.emit("nexus-update", {
    type: "connection",
    message: "Connected to NEXUS Unified System",
    capabilities: [
      "consciousness_monitoring",
      "collaborative_learning", 
      "knowledge_sharing",
      "multi_modal_processing",
      "real_time_metrics"
    ]
  });

  // Authentication for protected features
  socket.on("authenticate", (data) => {
    if (data.userId === 'chris.mwd20') { // Single-user system
      const client = connectedClients.get(socket.id);
      if (client) {
        client.userId = data.userId;
        socket.emit("auth-success", { message: "Authenticated for advanced features" });
        console.log(`✅ Client ${socket.id} authenticated as ${data.userId}`);
      }
    } else {
      socket.emit("auth-failed", { message: "Unauthorized access" });
    }
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
      
      // Add WebSocket client to collaboration system for real-time updates
      collaborationSystem.addClient(socket);
      
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
    const collaborationMetrics = collaborationSystem ? await collaborationSystem.getSystemMetrics() : null;
    
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
      (safetyMetrics.reliableSourcesCount / Math.max(1, safetyMetrics.totalSourcesEvaluated)) * 100);
    
    // Real learning efficiency from curriculum engine metrics
    const learningEfficiency = Math.min(100,
      curriculumMetrics ? curriculumMetrics.learningEfficiency * 100 : 75);
    
    // Real cost per hour from actual compute usage
    const realCostPerHour = aiSystemMetrics.totalComputeTime > 0 
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
    
    // Broadcast to all connected clients
    io.emit("metrics-update", newMetrics);

    // Add activities based on actual AI system performance
    if (aiSystemMetrics.totalRequests > 0) {
      const avgResponseTime = aiSystemMetrics.totalComputeTime / aiSystemMetrics.totalRequests;
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

// Vite setup moved above API routes

// Initialize consciousness bridge
consciousnessBridge.initialize();

// Start autonomous NEXUS learning with local models
console.log("🤖 Local NEXUS System initialized");

const PORT = parseInt(process.env.PORT || "5000", 10);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 NEXUS (NEXUS Unified System) running on http://0.0.0.0:${PORT}`);
  console.log(`💰 Local compute cost tracking enabled`);
  console.log(`🏠 100% Local AI - No external dependencies`);
});
