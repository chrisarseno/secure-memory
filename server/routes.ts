import express, { type Request, Response } from "express";
import { IStorage } from "./storage";
import { insertActivityEventSchema, insertCollaborationMessageSchema, emergencyActionSchema } from "../shared/schema";
import { z } from "zod";
import { requireAuth } from "./auth";

export function createRoutes(storage: IStorage, localNexusSystem?: any, collaborationSystem?: any, distributedSystem?: any) {
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
      const currentMetrics = await storage.getLatestMetrics();
      
      // Get previous metrics from 1 hour ago for real percentage changes
      const metricsHistory = await storage.getMetricsHistory(1); // 1 hour
      const previousMetrics = metricsHistory.length > 1 ? metricsHistory[metricsHistory.length - 2] : null;
      
      const response = {
        ...currentMetrics,
        previousMetrics: previousMetrics ? {
          consciousnessCoherence: previousMetrics.consciousnessCoherence,
          creativeIntelligence: previousMetrics.creativeIntelligence,
          safetyCompliance: previousMetrics.safetyCompliance,
          learningEfficiency: previousMetrics.learningEfficiency,
        } : null
      };
      
      res.json(response);
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

  // Local AI Models
  router.get("/api/local-models", async (req: Request, res: Response) => {
    try {
      if (localNexusSystem && localNexusSystem.getAIService) {
        const aiService = localNexusSystem.getAIService();
        const models = aiService.getAvailableModels();
        const modelList = Array.from(models.entries()).map(([id, model]) => ({
          id,
          name: model.name,
          type: model.type,
          status: model.status,
          capabilities: model.capabilities,
          memoryMB: model.memoryMB,
          specialized: model.specialized
        }));
        res.json(modelList);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Failed to fetch local models:', error);
      res.status(500).json({ error: "Failed to fetch local models" });
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

    // Knowledge Graph endpoints
    router.get("/api/nexus/knowledge-graph", async (req: Request, res: Response) => {
      try {
        const graphData = await localNexusSystem.getKnowledgeGraphData();
        res.json(graphData);
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to get knowledge graph", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    router.post("/api/nexus/knowledge", async (req: Request, res: Response) => {
      try {
        const { content, type, metadata, sources } = req.body;
        const node = await localNexusSystem.addKnowledge(content, type, metadata, sources);
        res.json({ success: true, node });
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to add knowledge", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    router.get("/api/nexus/contradictions", async (req: Request, res: Response) => {
      try {
        const { severity } = req.query;
        const contradictions = await localNexusSystem.getContradictions(severity as string);
        res.json(contradictions);
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to get contradictions", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    router.post("/api/nexus/contradictions/:contradictionId/resolve", async (req: Request, res: Response) => {
      try {
        const { contradictionId } = req.params;
        const { resolution, proposedResolution } = req.body;
        const success = await localNexusSystem.resolveContradiction(
          contradictionId, 
          resolution, 
          proposedResolution
        );
        res.json({ success });
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to resolve contradiction", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    // Daily Knowledge Diff endpoint
    router.get("/api/nexus/knowledge-diff", async (req: Request, res: Response) => {
      try {
        const { date } = req.query;
        const diff = await localNexusSystem.generateDailyKnowledgeDiff(date as string);
        res.json(diff);
      } catch (error) {
        res.status(500).json({ 
          error: "Failed to generate knowledge diff", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    });

    // Self-learning endpoints
    router.post("/api/nexus/learning/start", async (req: Request, res: Response) => {
      try {
        const result = await localNexusSystem.startAutonomousLearning();
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to start autonomous learning",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.get("/api/nexus/learning/stats", async (req: Request, res: Response) => {
      try {
        const stats = await localNexusSystem.getLearningStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get learning stats",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/training/start", async (req: Request, res: Response) => {
      try {
        const result = await localNexusSystem.startIncrementalTraining();
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to start incremental training",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/learning/experience", async (req: Request, res: Response) => {
      try {
        const { taskType, input, expectedOutput, actualOutput, feedback, context } = req.body;
        await localNexusSystem.recordLearningExperience(
          taskType, input, expectedOutput, actualOutput, feedback, context
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({
          error: "Failed to record learning experience",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/goal/enhanced", async (req: Request, res: Response) => {
      try {
        const { goal, context, computeBudget } = req.body;
        const result = await localNexusSystem.executeGoalWithLearning(goal, context, computeBudget);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to execute enhanced goal",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Multi-modal processing endpoints - REQUIRE AUTHENTICATION
    router.post('/api/nexus/analyze/image', requireAuth, async (req: Request, res: Response) => {
      try {
        const { imageData, prompt } = req.body;
        
        if (!imageData) {
          return res.status(400).json({ 
            error: 'Image data required',
            details: 'Please provide base64 encoded image data'
          });
        }

        const result = await localAI.analyzeImage(imageData, prompt);
        res.json({
          success: true,
          analysis: result.content,
          confidence: result.confidence,
          model: result.model,
          metadata: result.metadata,
          processingTime: result.generationTimeMs,
          cost: result.cost
        });
      } catch (error: any) {
        console.error('❌ Image analysis endpoint error:', error);
        res.status(500).json({ 
          error: 'Image analysis failed',
          details: error.message
        });
      }
    });

    router.post('/api/nexus/analyze/audio', requireAuth, async (req: Request, res: Response) => {
      try {
        const { audioData, format } = req.body;
        
        if (!audioData) {
          return res.status(400).json({ 
            error: 'Audio data required',
            details: 'Please provide audio buffer data'
          });
        }

        const audioBuffer = Buffer.from(audioData, 'base64');
        const result = await localAI.transcribeAudio(audioBuffer, format || 'wav');
        
        res.json({
          success: true,
          transcription: result.content,
          confidence: result.confidence,
          model: result.model,
          metadata: result.metadata,
          processingTime: result.generationTimeMs,
          cost: result.cost
        });
      } catch (error: any) {
        console.error('❌ Audio transcription endpoint error:', error);
        res.status(500).json({ 
          error: 'Audio transcription failed',
          details: error.message
        });
      }
    });

    router.post('/api/nexus/analyze/document', requireAuth, async (req: Request, res: Response) => {
      try {
        const { content, docType } = req.body;
        
        if (!content) {
          return res.status(400).json({ 
            error: 'Document content required',
            details: 'Please provide document content to analyze'
          });
        }

        const result = await localAI.analyzeDocument(content, docType || 'text');
        
        res.json({
          success: true,
          analysis: result.content,
          confidence: result.confidence,
          model: result.model,
          metadata: result.metadata,
          processingTime: result.generationTimeMs,
          cost: result.cost
        });
      } catch (error: any) {
        console.error('❌ Document analysis endpoint error:', error);
        res.status(500).json({ 
          error: 'Document analysis failed',
          details: error.message
        });
      }
    });

    // Consciousness backup and transfer endpoints - REQUIRE AUTHENTICATION
    router.post("/api/nexus/consciousness/snapshot", requireAuth, async (req: Request, res: Response) => {
      try {
        const { description } = req.body;
        const snapshot = await localNexusSystem.createConsciousnessSnapshot(description);
        res.json(snapshot);
      } catch (error) {
        res.status(500).json({
          error: "Failed to create consciousness snapshot",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/consciousness/restore", requireAuth, async (req: Request, res: Response) => {
      try {
        const { snapshotId } = req.body;
        const result = await localNexusSystem.restoreFromSnapshot(snapshotId);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to restore consciousness",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.get("/api/nexus/consciousness/snapshots", requireAuth, async (req: Request, res: Response) => {
      try {
        const snapshots = await localNexusSystem.listSnapshots();
        res.json(snapshots);
      } catch (error) {
        res.status(500).json({
          error: "Failed to list snapshots",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.get("/api/nexus/consciousness/backup-stats", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await localNexusSystem.getBackupStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get backup stats",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    router.post("/api/nexus/consciousness/transfer", requireAuth, async (req: Request, res: Response) => {
      try {
        const { targetSystem, protocol } = req.body;
        const result = await localNexusSystem.transferConsciousness(targetSystem, protocol);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: "Failed to transfer consciousness",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
  }

  // AI Collaboration System Routes
  if (collaborationSystem) {
    // Get agent status
    router.get("/api/collaboration/agents", requireAuth, async (req: Request, res: Response) => {
      try {
        const agents = collaborationSystem.getAgentStatus();
        res.json(agents);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get agent status",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Get active collaborations
    router.get("/api/collaboration/active", requireAuth, async (req: Request, res: Response) => {
      try {
        const collaborations = collaborationSystem.getActiveCollaborations();
        res.json(collaborations);
      } catch (error) {
        res.status(500).json({
          error: "Failed to get active collaborations", 
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Initiate AI-to-AI collaboration
    router.post("/api/collaboration/initiate", requireAuth, async (req: Request, res: Response) => {
      try {
        const { from, to, type, content, priority = 'medium' } = req.body;
        const collaborationId = await collaborationSystem.initiateCollaboration({
          from,
          to,
          type,
          content,
          priority
        });
        res.json({ collaborationId, status: 'initiated' });
      } catch (error) {
        res.status(500).json({
          error: "Failed to initiate collaboration",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Start distributed problem solving
    router.post("/api/collaboration/problem-solve", requireAuth, async (req: Request, res: Response) => {
      try {
        const { problem } = req.body;
        const coordinationId = await collaborationSystem.initiateDistributedProblemSolving(problem);
        res.json({ coordinationId, status: 'started' });
      } catch (error) {
        res.status(500).json({
          error: "Failed to start distributed problem solving",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
  }

  // Distributed Consciousness Routes
  if (distributedSystem) {
    // Get distributed system status and cluster overview
    router.get('/api/distributed/status', requireAuth, async (req: Request, res: Response) => {
      try {
        const status = distributedSystem.getSystemStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch distributed system status' });
      }
    });

    // Get all cluster nodes
    router.get('/api/distributed/nodes', requireAuth, async (req: Request, res: Response) => {
      try {
        const nodes = distributedSystem.getClusterNodes();
        res.json(nodes);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cluster nodes' });
      }
    });

    // Process collective consciousness query
    router.post('/api/distributed/query', requireAuth, async (req: Request, res: Response) => {
      try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
          return res.status(400).json({ error: 'Query is required and must be a string' });
        }

        const result = await distributedSystem.processCollectiveQuery(query);
        res.json(result);
      } catch (error) {
        console.error('Collective query error:', error);
        res.status(500).json({ error: 'Failed to process collective query' });
      }
    });

    // Distribute a consciousness processing task
    router.post('/api/distributed/task', requireAuth, async (req: Request, res: Response) => {
      try {
        const { type, moduleIds, payload, priority = 'medium' } = req.body;
        
        if (!type || !moduleIds || !payload) {
          return res.status(400).json({ error: 'type, moduleIds, and payload are required' });
        }

        const taskId = await distributedSystem.distributeTask(type, moduleIds, payload, priority);
        res.json({ taskId, status: 'distributed' });
      } catch (error) {
        console.error('Task distribution error:', error);
        res.status(500).json({ error: 'Failed to distribute task' });
      }
    });

    // Join an existing consciousness cluster
    router.post('/api/distributed/join-cluster', requireAuth, async (req: Request, res: Response) => {
      try {
        const { seedNodes } = req.body;
        
        if (!seedNodes || !Array.isArray(seedNodes)) {
          return res.status(400).json({ error: 'seedNodes array is required' });
        }

        await distributedSystem.joinCluster(seedNodes);
        res.json({ message: 'Successfully joined consciousness cluster' });
      } catch (error) {
        console.error('Cluster join error:', error);
        res.status(500).json({ error: 'Failed to join cluster' });
      }
    });

    // Manually trigger consciousness synchronization
    router.post('/api/distributed/sync', requireAuth, async (req: Request, res: Response) => {
      try {
        await distributedSystem.synchronizeConsciousness();
        res.json({ message: 'Consciousness synchronization initiated' });
      } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to synchronize consciousness' });
      }
    });

    // Update node health metrics
    router.post('/api/distributed/health', requireAuth, async (req: Request, res: Response) => {
      try {
        const { cpu, memory, consciousnessLoad, responseTime, activeConnections } = req.body;
        
        if (cpu === undefined || memory === undefined || consciousnessLoad === undefined) {
          return res.status(400).json({ error: 'cpu, memory, and consciousnessLoad metrics are required' });
        }

        await distributedSystem.updateNodeHealth({
          cpu: parseFloat(cpu),
          memory: parseFloat(memory),
          consciousnessLoad: parseFloat(consciousnessLoad),
          responseTime: parseFloat(responseTime) || 0,
          activeConnections: parseInt(activeConnections) || 0
        });

        res.json({ message: 'Node health updated successfully' });
      } catch (error) {
        console.error('Health update error:', error);
        res.status(500).json({ error: 'Failed to update node health' });
      }
    });
  }

  return router;
}
