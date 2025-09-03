import express, { type Request, Response } from "express";
import { IStorage } from "./storage";
import { insertActivityEventSchema, insertCollaborationMessageSchema, emergencyActionSchema } from "../shared/schema";
import { z } from "zod";

export function createRoutes(storage: IStorage, localNexusSystem?: any) {
  const router = express.Router();

  // Consciousness Modules
  router.get("/api/modules", async (req: Request, res: Response) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  router.get("/api/modules/:id", async (req: Request, res: Response) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  router.patch("/api/modules/:id", async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const module = await storage.updateModule(req.params.id, updates);
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  // System Metrics
  router.get("/api/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getLatestMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  router.get("/api/metrics/history", async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await storage.getMetricsHistory(hours);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics history" });
    }
  });

  // Activity Feed
  router.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  router.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const validatedActivity = insertActivityEventSchema.parse(req.body);
      const activity = await storage.addActivity(validatedActivity);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid activity data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add activity" });
    }
  });

  // Safety Status
  router.get("/api/safety", async (req: Request, res: Response) => {
    try {
      const status = await storage.getLatestSafetyStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch safety status" });
    }
  });

  // Knowledge Graph
  router.get("/api/knowledge-graph", async (req: Request, res: Response) => {
    try {
      const graph = await storage.getKnowledgeGraph();
      res.json(graph);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge graph" });
    }
  });

  // AI Collaboration
  router.get("/api/collaboration/messages", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await storage.getCollaborationMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collaboration messages" });
    }
  });

  router.post("/api/collaboration/messages", async (req: Request, res: Response) => {
    try {
      const validatedMessage = insertCollaborationMessageSchema.parse(req.body);
      const message = await storage.addCollaborationMessage(validatedMessage);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  // Emergency Actions
  router.post("/api/emergency", async (req: Request, res: Response) => {
    try {
      const validatedAction = emergencyActionSchema.omit({ timestamp: true }).parse(req.body);
      const action = await storage.executeEmergencyAction(validatedAction);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid emergency action", details: error.errors });
      }
      res.status(500).json({ error: "Failed to execute emergency action" });
    }
  });

  router.get("/api/emergency/history", async (req: Request, res: Response) => {
    try {
      const history = await storage.getEmergencyHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emergency history" });
    }
  });


  // Local NEXUS Endpoints
  if (localNexusSystem) {
    router.post("/api/nexus/execute", async (req: Request, res: Response) => {
      try {
        const { goal, context, computeBudget } = req.body;
        const result = await localNexusSystem.executeGoal(
          goal || "Analyze current system state",
          context || {},
          computeBudget || 60000
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Local NEXUS execution failed", details: error instanceof Error ? error.message : "Unknown error" });
      }
    });

    router.get("/api/nexus/costs", async (req: Request, res: Response) => {
      try {
        const totalCost = localNexusSystem.getTotalCost();
        const hourlyCost = localNexusSystem.getHourlyCostRate();
        res.json({ totalCost, hourlyCost });
      } catch (error) {
        res.status(500).json({ error: "Failed to get local cost data" });
      }
    });

    router.get("/api/nexus/metrics", async (req: Request, res: Response) => {
      try {
        const metrics = await localNexusSystem.getLocalMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: "Failed to get NEXUS metrics" });
      }
    });

    router.get("/api/nexus/knowledge", async (req: Request, res: Response) => {
      try {
        const knowledgeBase = await localNexusSystem.getKnowledgeBase();
        const query = req.query.query as string;
        const facts = await knowledgeBase.getFacts(query);
        res.json(facts);
      } catch (error) {
        res.status(500).json({ error: "Failed to get knowledge base" });
      }
    });

    router.post("/api/nexus/learn", async (req: Request, res: Response) => {
      try {
        const learningCycle = await localNexusSystem.initiateLearningCycle();
        res.json({
          success: true,
          ...learningCycle,
          message: `Initiated learning cycle: ${learningCycle.gaps.length} gaps identified, ${learningCycle.tasks.length} tasks generated`
        });
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to initiate learning cycle",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/learn/task/:taskId", async (req: Request, res: Response) => {
      try {
        const { taskId } = req.params;
        const result = await localNexusSystem.executeLearningTask(taskId);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to execute learning task",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
  }

  return router;
}
