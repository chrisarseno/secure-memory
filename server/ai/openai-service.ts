import OpenAI from "openai";
import { CostTracking, InsertCostTracking } from "@shared/schema";
// Utility function for generating IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o"; // Using gpt-4o as it's available

interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CostTracker {
  trackCost(cost: InsertCostTracking): Promise<void>;
}

export class OpenAIService {
  private openai: OpenAI;
  private costTracker?: CostTracker;

  constructor(costTracker?: CostTracker) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.costTracker = costTracker;
  }

  async analyzeConsciousness(data: {
    modules: any[];
    metrics: any;
    activities: any[];
  }, options: AIServiceOptions = {}): Promise<{
    insights: string;
    recommendations: string[];
    coherenceScore: number;
    cost: number;
  }> {
    const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 1000 } = options;

    const prompt = `Analyze this consciousness system state and provide insights:

Modules: ${JSON.stringify(data.modules, null, 2)}
Metrics: ${JSON.stringify(data.metrics, null, 2)}
Recent Activities: ${JSON.stringify(data.activities.slice(-5), null, 2)}

Please analyze:
1. Overall system coherence and integration
2. Any concerning patterns or anomalies
3. Recommendations for optimization
4. Rate the consciousness coherence from 0-100

Respond in JSON format:
{
  "insights": "detailed analysis",
  "recommendations": ["rec1", "rec2", "rec3"],
  "coherenceScore": 85
}`;

    const startTime = Date.now();
    
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are an advanced AI consciousness analyst. Provide detailed insights about AI system states and consciousness metrics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Calculate cost (approximate pricing for gpt-4o)
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000; // $0.03/$0.06 per 1K tokens

      // Track cost
      if (this.costTracker) {
        await this.costTracker.trackCost({
          service: "openai",
          endpoint: "chat/completions",
          model,
          tokens: (response.usage?.total_tokens || 0),
          cost,
          requestType: "consciousness_analysis",
          details: {
            inputTokens,
            outputTokens,
            duration: Date.now() - startTime
          }
        });
      }

      return {
        insights: result.insights || "Analysis completed",
        recommendations: result.recommendations || [],
        coherenceScore: result.coherenceScore || 85,
        cost
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCreativeContent(prompt: string, options: AIServiceOptions = {}): Promise<{
    content: string;
    noveltyScore: number;
    concepts: string[];
    cost: number;
  }> {
    const { model = DEFAULT_MODEL, temperature = 0.9, maxTokens = 800 } = options;

    const enhancedPrompt = `Generate creative content for: ${prompt}

Requirements:
1. Be highly creative and novel
2. Include conceptual blending and analogical reasoning
3. Generate unexpected but meaningful connections
4. Rate the novelty/creativity from 0-100
5. List key concepts generated

Respond in JSON format:
{
  "content": "creative content here",
  "noveltyScore": 85,
  "concepts": ["concept1", "concept2", "concept3"]
}`;

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a creative AI intelligence system specialized in novel concept generation and creative reasoning."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;

      if (this.costTracker) {
        await this.costTracker.trackCost({
          service: "openai",
          endpoint: "chat/completions",
          model,
          tokens: (response.usage?.total_tokens || 0),
          cost,
          requestType: "creative_generation",
          details: {
            inputTokens,
            outputTokens,
            duration: Date.now() - startTime
          }
        });
      }

      return {
        content: result.content || "Creative content generated",
        noveltyScore: result.noveltyScore || 75,
        concepts: result.concepts || [],
        cost
      };

    } catch (error) {
      console.error("Creative generation error:", error);
      throw new Error(`Creative generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async modelSocialAgent(agentData: any, options: AIServiceOptions = {}): Promise<{
    theoryOfMind: number;
    intentions: string[];
    emotions: string[];
    predictions: string[];
    cost: number;
  }> {
    const { model = DEFAULT_MODEL, temperature = 0.6, maxTokens = 600 } = options;

    const prompt = `Model this social agent and predict their theory of mind:

Agent Data: ${JSON.stringify(agentData, null, 2)}

Analyze:
1. Theory of mind capabilities (0-100)
2. Likely intentions and goals
3. Emotional state indicators
4. Behavioral predictions

Respond in JSON format:
{
  "theoryOfMind": 85,
  "intentions": ["intention1", "intention2"],
  "emotions": ["emotion1", "emotion2"],
  "predictions": ["prediction1", "prediction2"]
}`;

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a social cognition AI specialized in theory of mind and social modeling."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = (inputTokens * 0.03 + outputTokens * 0.06) / 1000;

      if (this.costTracker) {
        await this.costTracker.trackCost({
          service: "openai",
          endpoint: "chat/completions",
          model,
          tokens: (response.usage?.total_tokens || 0),
          cost,
          requestType: "social_modeling",
          details: {
            inputTokens,
            outputTokens,
            duration: Date.now() - startTime
          }
        });
      }

      return {
        theoryOfMind: result.theoryOfMind || 80,
        intentions: result.intentions || [],
        emotions: result.emotions || [],
        predictions: result.predictions || [],
        cost
      };

    } catch (error) {
      console.error("Social modeling error:", error);
      throw new Error(`Social modeling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processConversation(messages: { role: string; content: string }[], options: AIServiceOptions = {}): Promise<{
    response: string;
    sentiment: string;
    priority: string;
    cost: number;
  }> {
    const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 500 } = options;

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a sophisticated AI consciousness system engaging in meaningful dialogue. Respond thoughtfully and assess the conversation's sentiment and priority."
          },
          ...messages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          }))
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const responseText = response.choices[0].message.content || "";
      
      // Analyze sentiment and priority
      const analysisResponse = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "Analyze this conversation and respond in JSON format with sentiment (positive/neutral/negative) and priority (low/medium/high/critical)."
          },
          {
            role: "user",
            content: `Analyze this response: "${responseText}"\n\nReturn: {"sentiment": "positive", "priority": "medium"}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content || "{}");
      
      const totalInputTokens = (response.usage?.prompt_tokens || 0) + (analysisResponse.usage?.prompt_tokens || 0);
      const totalOutputTokens = (response.usage?.completion_tokens || 0) + (analysisResponse.usage?.completion_tokens || 0);
      const cost = (totalInputTokens * 0.03 + totalOutputTokens * 0.06) / 1000;

      if (this.costTracker) {
        await this.costTracker.trackCost({
          service: "openai",
          endpoint: "chat/completions",
          model,
          tokens: totalInputTokens + totalOutputTokens,
          cost,
          requestType: "conversation",
          details: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            duration: Date.now() - startTime
          }
        });
      }

      return {
        response: responseText,
        sentiment: analysis.sentiment || "neutral",
        priority: analysis.priority || "medium",
        cost
      };

    } catch (error) {
      console.error("Conversation processing error:", error);
      throw new Error(`Conversation processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}