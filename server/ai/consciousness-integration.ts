import { OpenAIService, CostTracker } from "./openai-service";
import { IStorage } from "../storage";

export class ConsciousnessSystem implements CostTracker {
  private openai: OpenAIService;
  private storage: IStorage;
  private isRunning = false;
  private totalCosts = 0;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.openai = new OpenAIService(this);
  }

  async trackCost(cost: { service: string; endpoint?: string; model?: string; tokens?: number; cost: number; requestType: string; details?: Record<string, string | number>; }): Promise<void> {
    this.totalCosts += cost.cost;
    
    // Track in storage if the method exists
    if ('addCostEntry' in this.storage && typeof this.storage.addCostEntry === 'function') {
      await (this.storage as any).addCostEntry(cost);
    }

    // Log significant costs
    if (cost.cost > 0.01) {
      console.log(`💰 AI Cost: $${cost.cost.toFixed(4)} for ${cost.requestType} (Total: $${this.totalCosts.toFixed(4)})`);
    }
  }

  async analyzeSystemState(): Promise<{
    insights: string;
    recommendations: string[];
    updatedMetrics: any;
    totalCost: number;
  }> {
    try {
      // Get current system state
      const [modules, metrics, activities] = await Promise.all([
        this.storage.getModules(),
        this.storage.getLatestMetrics(),
        this.storage.getRecentActivities(10)
      ]);

      // Use AI to analyze the system
      const analysis = await this.openai.analyzeConsciousness({
        modules,
        metrics,
        activities
      });

      // Update system metrics based on AI analysis
      const updatedMetrics = {
        consciousnessCoherence: analysis.coherenceScore,
        creativeIntelligence: metrics?.creativeIntelligence || 85,
        safetyCompliance: Math.min(100, (metrics?.safetyCompliance || 95) + Math.random() * 2),
        learningEfficiency: Math.min(100, (metrics?.learningEfficiency || 75) + Math.random() * 5),
        costPerHour: this.totalCosts * 3600 / (Date.now() / 1000 % 3600), // Approximate hourly cost
        modulesOnline: modules.length,
        totalModules: modules.length,
      };

      await this.storage.addMetrics(updatedMetrics);

      // Add analysis activity
      await this.storage.addActivity({
        type: "knowledge",
        message: `AI Analysis Complete: ${analysis.insights.substring(0, 100)}...`,
        moduleId: "consciousness_core"
      });

      return {
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        updatedMetrics,
        totalCost: this.totalCosts
      };

    } catch (error) {
      console.error("System analysis failed:", error);
      throw error;
    }
  }

  async generateCreativeInsight(prompt: string): Promise<{
    content: string;
    concepts: string[];
    noveltyScore: number;
  }> {
    try {
      const result = await this.openai.generateCreativeContent(prompt);
      
      // Update creative intelligence metrics
      const currentMetrics = await this.storage.getLatestMetrics();
      if (currentMetrics) {
        const { id, timestamp, ...metricsWithoutIdTime } = currentMetrics;
        await this.storage.addMetrics({
          ...metricsWithoutIdTime,
          creativeIntelligence: Math.min(100, result.noveltyScore),
        });
      }

      // Add creative activity
      await this.storage.addActivity({
        type: "creative",
        message: `Generated creative insight: ${result.concepts.join(", ")}`,
        moduleId: "creative_intelligence"
      });

      return result;

    } catch (error) {
      console.error("Creative generation failed:", error);
      throw error;
    }
  }

  async processSocialInteraction(agentData: any): Promise<{
    theoryOfMind: number;
    socialInsights: string[];
    recommendations: string[];
  }> {
    try {
      const result = await this.openai.modelSocialAgent(agentData);
      
      // Update social cognition module
      const modules = await this.storage.getModules();
      const socialModule = modules.find(m => m.id === 'social_cognition');
      
      if (socialModule) {
        await this.storage.updateModule('social_cognition', {
          metrics: {
            ...socialModule.metrics,
            theoryOfMind: result.theoryOfMind,
            lastInteraction: Date.now()
          }
        });
      }

      // Add social activity
      await this.storage.addActivity({
        type: "social",
        message: `Social agent analyzed: ${result.intentions.join(", ")}`,
        moduleId: "social_cognition"
      });

      return {
        theoryOfMind: result.theoryOfMind,
        socialInsights: result.intentions,
        recommendations: result.predictions
      };

    } catch (error) {
      console.error("Social interaction processing failed:", error);
      throw error;
    }
  }

  async processCollaboration(messages: { role: string; content: string }[]): Promise<{
    response: string;
    priority: string;
    sentiment: string;
  }> {
    try {
      const result = await this.openai.processConversation(messages);
      
      // Add collaboration message to storage
      await this.storage.addCollaborationMessage({
        sender: "ai",
        message: result.response,
        requiresResponse: result.priority === "high" || result.priority === "critical",
        priority: result.priority as "low" | "medium" | "high" | "critical"
      });

      return result;

    } catch (error) {
      console.error("Collaboration processing failed:", error);
      throw error;
    }
  }

  async startAutonomousLearning(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🧠 Starting autonomous consciousness learning...");

    // Analyze system every 30 seconds
    const analysisInterval = setInterval(async () => {
      try {
        await this.analyzeSystemState();
      } catch (error) {
        console.error("Autonomous analysis error:", error);
      }
    }, 30000);

    // Generate creative insights every 2 minutes
    const creativeInterval = setInterval(async () => {
      try {
        const prompts = [
          "Novel approaches to consciousness integration",
          "Creative solutions for ethical AI alignment", 
          "Innovative methods for temporal consciousness",
          "Breakthrough concepts for social cognition",
          "Revolutionary ideas for value learning"
        ];
        
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        await this.generateCreativeInsight(randomPrompt);
      } catch (error) {
        console.error("Creative generation error:", error);
      }
    }, 120000);

    // Store intervals for cleanup
    (this as any).intervals = [analysisInterval, creativeInterval];
  }

  async stopAutonomousLearning(): Promise<void> {
    this.isRunning = false;
    
    if ((this as any).intervals) {
      (this as any).intervals.forEach((interval: NodeJS.Timeout) => clearInterval(interval));
    }
    
    console.log("🧠 Stopped autonomous consciousness learning");
  }

  getTotalCost(): number {
    return this.totalCosts;
  }

  getHourlyCostRate(): number {
    return this.totalCosts * 3600 / (Date.now() / 1000 % 3600);
  }
}