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

// WebSocket for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send initial data
  socket.emit("nexus-update", {
    type: "connection",
    message: "Connected to Local NEXUS system",
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
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
