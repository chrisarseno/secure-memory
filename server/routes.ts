import express, { type Request, Response } from "express";
import { IStorage } from "./storage";
import { insertActivityEventSchema, insertCollaborationMessageSchema, emergencyActionSchema } from "../shared/schema";
import { z } from "zod";

export function createRoutes(storage: IStorage) {
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

  return router;
}
