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

app.use(cors());
app.use(express.json());

// Setup authentication
setupAuth(app);

// API Routes MUST come before static serving to avoid conflicts
app.use(createRoutes(storage, localNexusSystem));

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

  socket.on("disconnect", () => {
    connectedClients.delete(socket.id);
    console.log("🔌 Client disconnected from NEXUS collaboration system:", socket.id);
  });
});

// Simulate real-time consciousness updates
setInterval(async () => {
  try {
    // Update metrics with slight variations
    const currentMetrics = await storage.getLatestMetrics();
    if (currentMetrics) {
      const newMetrics = {
        consciousnessCoherence: Math.max(0, Math.min(100, currentMetrics.consciousnessCoherence + (Math.random() - 0.5) * 2)),
        creativeIntelligence: Math.max(0, Math.min(100, currentMetrics.creativeIntelligence + (Math.random() - 0.5) * 3)),
        safetyCompliance: Math.max(0, Math.min(100, currentMetrics.safetyCompliance + (Math.random() - 0.5) * 0.5)),
        learningEfficiency: Math.max(0, Math.min(100, currentMetrics.learningEfficiency + (Math.random() - 0.5) * 4)),
        costPerHour: currentMetrics.costPerHour + (Math.random() - 0.5) * 10,
        modulesOnline: 42,
        totalModules: 42,
      };

      await storage.addMetrics(newMetrics);
      
      // Broadcast to all connected clients
      io.emit("metrics-update", newMetrics);
    }

    // Randomly add activities
    if (Math.random() < 0.3) {
      const activities = [
        { type: "virtue" as const, message: "New virtue integrated: Patience", moduleId: "virtue_learning" },
        { type: "creative" as const, message: "Creative solution generated for climate modeling", moduleId: "creative_intelligence" },
        { type: "social" as const, message: "Social agent model updated: Research_Team_Alpha", moduleId: "social_cognition" },
        { type: "temporal" as const, message: "Temporal projection validated: 87% accuracy", moduleId: "temporal_consciousness" },
        { type: "knowledge" as const, message: "Knowledge graph updated: 1,247 new connections", moduleId: "global_workspace" },
      ];

      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      const activity = await storage.addActivity(randomActivity);
      
      io.emit("activity-update", activity);
    }

    // Update module statuses occasionally
    if (Math.random() < 0.1) {
      const modules = await storage.getModules();
      const randomModule = modules[Math.floor(Math.random() * modules.length)];
      
      const updated = await storage.updateModule(randomModule.id, {
        load: Math.max(0, Math.min(100, randomModule.load + (Math.random() - 0.5) * 10)),
        integrationLevel: Math.max(0, Math.min(100, randomModule.integrationLevel + (Math.random() - 0.5) * 2)),
      });
      
      io.emit("module-update", updated);
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
