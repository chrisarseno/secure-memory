/**
 * Local NEXUS System - Complete self-contained ensemble intelligence
 * No external API dependencies - runs entirely on local infrastructure
 */

import { LocalAIService } from './local-ai-service';
import { KnowledgeGraphEngine } from './knowledge-graph';
import { SourceReputationEngine } from './source-reputation';
import { SelfLearningAgent } from './self-learning-agent';
import { ConsciousnessBackupEngine } from './consciousness-backup';
import { IStorage } from '../storage';

export interface LocalTask {
  id: string;
  description: string;
  type: 'research' | 'analysis' | 'verification' | 'synthesis' | 'creative';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedComputeTime: number;
  parentGoalId?: string;
}

export interface LocalExecutionResult {
  taskId: string;
  content: string;
  sources: string[];
  confidence: number;
  computeCost: number;
  modelUsed: string;
  executionTime: number;
  metadata: Record<string, any>;
}

export interface LocalVerificationResult {
  passed: boolean;
  confidence: number;
  issues: string[];
  believabilityScore: number;
  needsHumanReview: boolean;
  verificationModel: string;
}

export interface LocalKnowledgeFact {
  id: string;
  content: string;
  sources: string[];
  believabilityScore: number;
  lastVerified: Date;
  taskId: string;
  provenance: string[];
  version: number;
  localVerification: boolean;
}

/**
 * LOCAL PLANNER: Uses local AI for goal decomposition
 */
export class LocalTaskPlanner {
  private localAI: LocalAIService;

  constructor(localAI: LocalAIService) {
    this.localAI = localAI;
  }

  async decompose(goal: string, context: any = {}): Promise<LocalTask[]> {
    try {
      console.log(`📋 Local planning for goal: ${goal}`);
      
      const response = await this.localAI.planTasks(goal);
      
      // Parse the response and create structured tasks
      const taskDescriptions = this.extractTasks(response.content);
      
      return taskDescriptions.map((desc, index) => ({
        id: `task_${Date.now()}_${index}`,
        description: desc,
        type: this.inferTaskType(desc),
        priority: this.inferPriority(desc, goal),
        estimatedComputeTime: this.estimateComputeTime(desc),
        parentGoalId: goal
      }));

    } catch (error) {
      console.error('Local planning failed:', error);
      // Fallback to simple task breakdown
      return [{
        id: `task_${Date.now()}_fallback`,
        description: `Research and analyze: ${goal}`,
        type: 'analysis',
        priority: 'medium',
        estimatedComputeTime: 30000
      }];
    }
  }

  private extractTasks(planContent: string): string[] {
    // Extract task descriptions from AI response
    const lines = planContent.split('\n').filter(line => 
      line.trim() && 
      (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.'))
    );
    
    return lines.map(line => 
      line.replace(/^[•\-\d\.\s]+/, '').trim()
    ).filter(task => task.length > 10);
  }

  private inferTaskType(description: string): LocalTask['type'] {
    const desc = description.toLowerCase();
    if (desc.includes('research') || desc.includes('find') || desc.includes('gather')) return 'research';
    if (desc.includes('analyze') || desc.includes('examine') || desc.includes('evaluate')) return 'analysis';
    if (desc.includes('verify') || desc.includes('check') || desc.includes('validate')) return 'verification';
    if (desc.includes('create') || desc.includes('generate') || desc.includes('design')) return 'creative';
    return 'synthesis';
  }

  private inferPriority(description: string, goal: string): LocalTask['priority'] {
    const desc = description.toLowerCase();
    if (desc.includes('critical') || desc.includes('urgent') || desc.includes('immediate')) return 'critical';
    if (desc.includes('important') || desc.includes('key') || desc.includes('essential')) return 'high';
    if (desc.includes('optional') || desc.includes('nice to have')) return 'low';
    return 'medium';
  }

  private estimateComputeTime(description: string): number {
    // Estimate in milliseconds based on task complexity
    const words = description.split(' ').length;
    const baseTime = 10000; // 10 seconds base
    const complexityMultiplier = Math.min(3, words / 10);
    
    return Math.round(baseTime * complexityMultiplier);
  }
}

/**
 * LOCAL ROUTER: Selects optimal local models for each task
 */
export class LocalTaskRouter {
  private localAI: LocalAIService;
  private routingHistory: Map<string, number[]> = new Map();

  constructor(localAI: LocalAIService) {
    this.localAI = localAI;
  }

  selectModel(task: LocalTask, computeBudget: number): {
    modelType: string;
    confidence: number;
    estimatedCost: number;
  } {
    const availableModels = this.localAI.getAvailableModels();
    
    // Filter models by capability
    const capableModels = availableModels.filter(model => 
      model.capabilities.includes(task.type) || 
      model.specialized === this.getModelSpecialization(task.type)
    );

    if (capableModels.length === 0) {
      // Fallback to reasoning model
      return {
        modelType: 'reasoning',
        confidence: 0.6,
        estimatedCost: task.estimatedComputeTime * 0.0001
      };
    }

    // Select based on performance history and task requirements
    const bestModel = capableModels.reduce((best, current) => {
      const bestScore = this.getModelScore(best.specialized, task.type);
      const currentScore = this.getModelScore(current.specialized, task.type);
      return currentScore > bestScore ? current : best;
    });

    return {
      modelType: bestModel.specialized,
      confidence: 0.8,
      estimatedCost: task.estimatedComputeTime * 0.0001
    };
  }

  private getModelSpecialization(taskType: string): string {
    const mapping = {
      'research': 'reasoning',
      'analysis': 'analysis', 
      'verification': 'verification',
      'creative': 'creative',
      'synthesis': 'reasoning'
    };
    return mapping[taskType] || 'reasoning';
  }

  private getModelScore(modelType: string, taskType: string): number {
    const history = this.routingHistory.get(`${modelType}_${taskType}`) || [0.7];
    return history.reduce((sum, score) => sum + score) / history.length;
  }

  updatePerformance(modelType: string, taskType: string, performance: number) {
    const key = `${modelType}_${taskType}`;
    const history = this.routingHistory.get(key) || [];
    history.push(performance);
    
    if (history.length > 10) {
      history.shift();
    }
    
    this.routingHistory.set(key, history);
  }
}

/**
 * LOCAL EXECUTOR: Runs tasks using selected local models
 */
export class LocalTaskExecutor {
  private localAI: LocalAIService;

  constructor(localAI: LocalAIService) {
    this.localAI = localAI;
  }

  async execute(task: LocalTask, selectedModel: any): Promise<LocalExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`⚡ Executing task ${task.id} with ${selectedModel.modelType} model`);
      
      let result: any;

      switch (task.type) {
        case 'analysis':
          result = await this.localAI.analyzeTask(task.description, {});
          break;
        case 'creative':
          result = await this.localAI.generateCreative(task.description);
          break;
        case 'verification':
          result = await this.localAI.verifyResult(task.description, task.description);
          break;
        default:
          result = await this.localAI.generateResponse(task.description, selectedModel.modelType);
      }

      return {
        taskId: task.id,
        content: result.content,
        sources: ['local_ai_processing'],
        confidence: result.confidence,
        computeCost: result.cost,
        modelUsed: result.model,
        executionTime: Date.now() - startTime,
        metadata: {
          modelType: selectedModel.modelType,
          tokens: result.tokensGenerated,
          localProcessing: true
        }
      };

    } catch (error) {
      console.error(`Local execution failed for task ${task.id}:`, error);
      throw error;
    }
  }
}

/**
 * LOCAL VERIFIER: Multi-model verification using different local models
 */
export class LocalTaskVerifier {
  private localAI: LocalAIService;

  constructor(localAI: LocalAIService) {
    this.localAI = localAI;
  }

  async verify(result: LocalExecutionResult, task: LocalTask): Promise<LocalVerificationResult> {
    try {
      console.log(`✅ Verifying task ${task.id} with adversarial model`);
      
      // Use a different model for verification to avoid same-model bias
      const verificationResponse = await this.localAI.verifyResult(result.content, task.description);
      
      // Extract verification details
      const believabilityScore = this.extractBelievabilityScore(verificationResponse.content);
      const issues = this.extractIssues(verificationResponse.content);
      
      const passed = believabilityScore > 0.7 && issues.length < 2;
      const needsHumanReview = believabilityScore < 0.8 || issues.length > 0;

      return {
        passed,
        confidence: verificationResponse.confidence,
        issues,
        believabilityScore,
        needsHumanReview,
        verificationModel: verificationResponse.model
      };

    } catch (error) {
      console.error('Local verification failed:', error);
      return {
        passed: false,
        confidence: 0.5,
        issues: ['Verification process failed'],
        believabilityScore: 0.5,
        needsHumanReview: true,
        verificationModel: 'fallback'
      };
    }
  }

  private extractBelievabilityScore(content: string): number {
    // Extract believability score from verification response
    const match = content.match(/believability[:\s]*([0-9.]+)/i);
    if (match) {
      return Math.min(1.0, Math.max(0.0, parseFloat(match[1])));
    }
    
    // Fallback: estimate based on content indicators
    if (content.includes('high confidence') || content.includes('reliable')) return 0.9;
    if (content.includes('moderate') || content.includes('likely')) return 0.7;
    if (content.includes('uncertain') || content.includes('unclear')) return 0.5;
    
    return 0.6;
  }

  private extractIssues(content: string): string[] {
    const issues: string[] = [];
    
    if (content.includes('inconsistent')) issues.push('Logical inconsistency detected');
    if (content.includes('unsupported')) issues.push('Insufficient evidence');
    if (content.includes('bias')) issues.push('Potential bias identified');
    if (content.includes('incomplete')) issues.push('Incomplete analysis');
    
    return issues;
  }
}

/**
 * LOCAL KNOWLEDGE BASE: Stores verified facts with local tracking
 */
export class LocalKnowledgeBase {
  private storage: IStorage;
  private facts: Map<string, LocalKnowledgeFact> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async storeFact(
    result: LocalExecutionResult,
    verification: LocalVerificationResult,
    task: LocalTask
  ): Promise<LocalKnowledgeFact> {
    const fact: LocalKnowledgeFact = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: result.content,
      sources: result.sources,
      believabilityScore: verification.believabilityScore,
      lastVerified: new Date(),
      taskId: task.id,
      provenance: [
        `Task: ${task.description}`,
        `Local Model: ${result.modelUsed}`,
        `Verification: ${verification.verificationModel}`,
        `Confidence: ${result.confidence}`
      ],
      version: 1,
      localVerification: true
    };

    this.facts.set(fact.id, fact);

    // Store in activity feed
    await this.storage.addActivity({
      type: 'knowledge',
      message: `Local fact verified: ${fact.content.substring(0, 100)}...`,
      moduleId: 'local_knowledge'
    });

    return fact;
  }

  async getFacts(query?: string): Promise<LocalKnowledgeFact[]> {
    const allFacts = Array.from(this.facts.values());
    
    if (!query) {
      return allFacts.sort((a, b) => b.believabilityScore - a.believabilityScore);
    }

    return allFacts.filter(fact => 
      fact.content.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => b.believabilityScore - a.believabilityScore);
  }

  // Methods for curriculum engine support
  async getLowConfidenceAreas(): Promise<Array<{
    domain: string;
    topic: string;
    description: string;
    confidence: number;
    importance: number;
    complexity?: number;
    prerequisites?: string[];
    sources?: string[];
  }>> {
    const factsByDomain = new Map<string, LocalKnowledgeFact[]>();
    
    // Group facts by extracting domain from content
    for (const fact of this.facts.values()) {
      const domain = this.extractDomain(fact.content);
      if (!factsByDomain.has(domain)) {
        factsByDomain.set(domain, []);
      }
      factsByDomain.get(domain)!.push(fact);
    }
    
    const lowConfidenceAreas = [];
    
    for (const [domain, domainFacts] of factsByDomain) {
      const avgConfidence = domainFacts.reduce((sum, f) => sum + f.believabilityScore, 0) / domainFacts.length;
      
      if (avgConfidence < 0.7 || domainFacts.length < 3) {
        lowConfidenceAreas.push({
          domain,
          topic: domain,
          description: `Insufficient or low-confidence knowledge in ${domain}`,
          confidence: avgConfidence,
          importance: this.calculateDomainImportance(domain, domainFacts),
          complexity: this.estimateComplexity(domainFacts),
          prerequisites: this.identifyPrerequisites(domain),
          sources: [...new Set(domainFacts.flatMap(f => f.sources))]
        });
      }
    }
    
    return lowConfidenceAreas.sort((a, b) => (b.importance * (1 - b.confidence)) - (a.importance * (1 - a.confidence)));
  }

  async findContradictions(): Promise<Array<{
    domain: string;
    description: string;
    conflictingSources: string[];
    facts: LocalKnowledgeFact[];
  }>> {
    const contradictions = [];
    const factsByDomain = new Map<string, LocalKnowledgeFact[]>();
    
    // Group by domain
    for (const fact of this.facts.values()) {
      const domain = this.extractDomain(fact.content);
      if (!factsByDomain.has(domain)) {
        factsByDomain.set(domain, []);
      }
      factsByDomain.get(domain)!.push(fact);
    }
    
    // Simple contradiction detection
    const opposingPairs = [
      ['increase', 'decrease'],
      ['true', 'false'],
      ['positive', 'negative'],
      ['beneficial', 'harmful'],
      ['effective', 'ineffective']
    ];
    
    for (const [domain, domainFacts] of factsByDomain) {
      for (const [term1, term2] of opposingPairs) {
        const facts1 = domainFacts.filter(f => f.content.toLowerCase().includes(term1));
        const facts2 = domainFacts.filter(f => f.content.toLowerCase().includes(term2));
        
        if (facts1.length > 0 && facts2.length > 0) {
          const allConflictingFacts = [...facts1, ...facts2];
          contradictions.push({
            domain,
            description: `Potential contradiction between statements containing "${term1}" and "${term2}"`,
            conflictingSources: [...new Set(allConflictingFacts.flatMap(f => f.sources))],
            facts: allConflictingFacts
          });
        }
      }
    }
    
    return contradictions;
  }

  async findMissingConnections(): Promise<Array<{
    domain1: string;
    domain2: string;
    suggestedConnection: string;
    importance: number;
  }>> {
    const domains = [...new Set(Array.from(this.facts.values()).map(f => this.extractDomain(f.content)))];
    const connections = [];
    
    const relatedDomains = [
      ['machine_learning', 'statistics'],
      ['programming', 'computer_science'],
      ['physics', 'mathematics'],
      ['biology', 'chemistry'],
      ['economics', 'psychology']
    ];
    
    for (const [domain1, domain2] of relatedDomains) {
      if (domains.includes(domain1) && domains.includes(domain2)) {
        const facts1 = Array.from(this.facts.values()).filter(f => this.extractDomain(f.content) === domain1);
        const facts2 = Array.from(this.facts.values()).filter(f => this.extractDomain(f.content) === domain2);
        
        const hasConnection = facts1.some(f1 => 
          facts2.some(f2 => 
            f1.content.toLowerCase().includes(domain2) || 
            f2.content.toLowerCase().includes(domain1)
          )
        );
        
        if (!hasConnection) {
          connections.push({
            domain1,
            domain2,
            suggestedConnection: `Explore connections between ${domain1} and ${domain2}`,
            importance: 0.8
          });
        }
      }
    }
    
    return connections;
  }

  // Helper methods
  private extractDomain(content: string): string {
    const keywords = content.toLowerCase();
    
    if (keywords.includes('machine learning') || keywords.includes('neural network')) return 'machine_learning';
    if (keywords.includes('programming') || keywords.includes('code') || keywords.includes('algorithm')) return 'programming';
    if (keywords.includes('mathematics') || keywords.includes('equation') || keywords.includes('calculation')) return 'mathematics';
    if (keywords.includes('physics') || keywords.includes('quantum') || keywords.includes('energy')) return 'physics';
    if (keywords.includes('statistics') || keywords.includes('probability') || keywords.includes('data analysis')) return 'statistics';
    if (keywords.includes('biology') || keywords.includes('organism') || keywords.includes('cell')) return 'biology';
    if (keywords.includes('chemistry') || keywords.includes('molecule') || keywords.includes('reaction')) return 'chemistry';
    if (keywords.includes('economics') || keywords.includes('market') || keywords.includes('financial')) return 'economics';
    if (keywords.includes('psychology') || keywords.includes('behavior') || keywords.includes('cognitive')) return 'psychology';
    
    return 'general';
  }

  private calculateDomainImportance(domain: string, facts: LocalKnowledgeFact[]): number {
    const factCount = facts.length;
    const avgConfidence = facts.reduce((sum, f) => sum + f.believabilityScore, 0) / factCount;
    
    const recentFacts = facts.filter(f => 
      Date.now() - f.lastVerified.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    const importance = Math.min(1.0, (factCount * 0.1) + (avgConfidence * 0.3) + (recentFacts * 0.2));
    return importance;
  }

  private estimateComplexity(facts: LocalKnowledgeFact[]): number {
    const avgLength = facts.reduce((sum, f) => sum + f.content.length, 0) / facts.length;
    const technicalTerms = ['algorithm', 'function', 'parameter', 'optimization', 'analysis'];
    const technicalDensity = facts.reduce((sum, f) => {
      const termCount = technicalTerms.filter(term => 
        f.content.toLowerCase().includes(term)
      ).length;
      return sum + termCount;
    }, 0) / facts.length;
    
    return Math.min(3.0, 1.0 + (avgLength / 200) + (technicalDensity * 0.5));
  }

  private identifyPrerequisites(domain: string): string[] {
    const prerequisiteMap: Record<string, string[]> = {
      'machine_learning': ['statistics', 'programming', 'mathematics'],
      'deep_learning': ['machine_learning', 'linear_algebra'],
      'computer_vision': ['machine_learning', 'image_processing'],
      'natural_language_processing': ['machine_learning', 'linguistics'],
      'quantum_computing': ['quantum_physics', 'linear_algebra', 'computer_science'],
      'blockchain': ['cryptography', 'distributed_systems'],
      'cybersecurity': ['networking', 'cryptography', 'system_administration']
    };
    
    return prerequisiteMap[domain] || [];
  }
}

/**
 * LOCAL SAGE SYSTEM: Complete local ensemble intelligence
 */
export class LocalNEXUSSystem {
  private localAI: LocalAIService;
  private planner: LocalTaskPlanner;
  private router: LocalTaskRouter;
  private executor: LocalTaskExecutor;
  private verifier: LocalTaskVerifier;
  private knowledgeBase: LocalKnowledgeBase;
  private knowledgeGraph: KnowledgeGraphEngine;
  private sourceReputation: SourceReputationEngine;
  private selfLearningAgent: SelfLearningAgent;
  private consciousnessBackup: ConsciousnessBackupEngine;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.localAI = new LocalAIService();
    this.planner = new LocalTaskPlanner(this.localAI);
    this.router = new LocalTaskRouter(this.localAI);
    this.executor = new LocalTaskExecutor(this.localAI);
    this.verifier = new LocalTaskVerifier(this.localAI);
    this.knowledgeBase = new LocalKnowledgeBase(storage);
    this.knowledgeGraph = new KnowledgeGraphEngine(storage, this.localAI);
    this.sourceReputation = new SourceReputationEngine(storage, this.localAI);
    this.selfLearningAgent = new SelfLearningAgent(storage, this.localAI, this.knowledgeGraph);
    this.consciousnessBackup = new ConsciousnessBackupEngine(
      storage, 
      this.localAI, 
      this.knowledgeGraph, 
      this.selfLearningAgent
    );
  }

  // Public method to access AI service for collaborative queries
  getAIService() {
    return this.localAI;
  }

  async executeGoal(goal: string, context: any = {}, computeBudget: number = 60000): Promise<{
    tasks: LocalTask[];
    results: LocalExecutionResult[];
    verifiedFacts: LocalKnowledgeFact[];
    needsHumanReview: string[];
    totalCost: number;
    systemMetrics: any;
  }> {
    console.log(`🎯 Local SAGE Learning Loop: Processing goal - ${goal}`);

    try {
      // 1. PLAN: Decompose goal using local AI
      const tasks = await this.planner.decompose(goal, context);
      console.log(`📋 Planned ${tasks.length} tasks locally`);

      const results: LocalExecutionResult[] = [];
      const verifiedFacts: LocalKnowledgeFact[] = [];
      const needsHumanReview: string[] = [];
      let totalCost = 0;

      // 2. EXECUTE & VERIFY each task locally
      for (const task of tasks) {
        try {
          // 3. ROUTE: Select optimal local model
          const selectedModel = this.router.selectModel(task, computeBudget - totalCost);
          console.log(`🔀 Routing task ${task.id} to ${selectedModel.modelType} model`);

          // 4. EXECUTE: Run task with local AI
          const result = await this.executor.execute(task, selectedModel);
          results.push(result);
          totalCost += result.computeCost;

          // 5. VERIFY: Check with different local model
          const verification = await this.verifier.verify(result, task);

          // 6. STORE: Save verified facts
          if (verification.passed) {
            const fact = await this.knowledgeBase.storeFact(result, verification, task);
            verifiedFacts.push(fact);
            console.log(`✅ Local fact verified and stored: ${fact.id}`);

            // 7. KNOWLEDGE GRAPH: Add to knowledge graph
            try {
              await this.knowledgeGraph.addKnowledgeNode(
                fact.content,
                'fact',
                {
                  domain: this.inferDomain(fact.content),
                  tags: this.extractTags(fact.content),
                  verificationLevel: 'peer-reviewed',
                  importance: verification.believabilityScore
                },
                fact.sources
              );
              console.log(`📚 Added to knowledge graph: ${fact.content.substring(0, 50)}...`);
            } catch (error) {
              console.warn('Failed to add fact to knowledge graph:', error);
            }

            // 8. SOURCE REPUTATION: Verify with multiple sources
            try {
              if (fact.sources.length > 1) {
                const consensus = await this.sourceReputation.verifyFactWithSources(
                  fact.content,
                  fact.sources,
                  'ai_analysis'
                );
                console.log(`🏆 Multi-source verification: ${consensus.consensusScore.toFixed(2)} consensus (${consensus.majorityPosition})`);
                
                // Update fact believability based on source consensus
                if (consensus.consensusScore > 0.8) {
                  fact.believabilityScore = Math.min(1, fact.believabilityScore + 0.1);
                } else if (consensus.consensusScore < 0.2) {
                  fact.believabilityScore = Math.max(0, fact.believabilityScore - 0.1);
                }
              }
            } catch (error) {
              console.warn('Failed to verify with source reputation:', error);
            }
          } else {
            console.log(`❌ Local verification failed for task ${task.id}`);
          }

          // 7. HUMAN REVIEW: Flag for review
          if (verification.needsHumanReview) {
            needsHumanReview.push(task.id);
          }

          // 8. LEARN: Update routing performance
          this.router.updatePerformance(selectedModel.modelType, task.type, verification.confidence);

        } catch (error) {
          console.error(`Local task ${task.id} failed:`, error);
          continue; // Graceful degradation
        }
      }

      // 9. REFLECT: Add system activity
      await this.storage.addActivity({
        type: 'knowledge',
        message: `Local SAGE completed: ${verifiedFacts.length} facts verified, $${totalCost.toFixed(6)} compute cost`,
        moduleId: 'local_sage'
      });

      const systemMetrics = this.localAI.getSystemMetrics();

      return {
        tasks,
        results,
        verifiedFacts,
        needsHumanReview,
        totalCost,
        systemMetrics
      };

    } catch (error) {
      console.error('Local SAGE Learning Loop failed:', error);
      throw error;
    }
  }

  async getKnowledgeBase() {
    return this.knowledgeBase;
  }

  async getLocalMetrics() {
    return this.localAI.getSystemMetrics();
  }

  getTotalCost(): number {
    return this.localAI.getTotalCost();
  }

  getHourlyCostRate(): number {
    return this.localAI.getHourlyCostRate();
  }

  // Curriculum engine integration
  async initiateLearningCycle(): Promise<{
    gaps: any[];
    tasks: any[];
    metrics: any;
  }> {
    try {
      const { CurriculumEngine } = await import('./curriculum-engine');
      const curriculum = new CurriculumEngine(this.knowledgeBase, this.localAI);
      
      // Identify learning gaps
      const gaps = await curriculum.identifyLearningGaps();
      console.log(`📚 Identified ${gaps.length} learning gaps`);
      
      // Generate learning tasks for top priority gaps
      const priorityGaps = gaps.slice(0, 3);
      const tasks = await curriculum.generateLearningTasks(priorityGaps);
      console.log(`📋 Generated ${tasks.length} learning tasks`);
      
      // Get curriculum metrics
      const metrics = curriculum.getMetrics();
      
      return { gaps, tasks, metrics };
    } catch (error) {
      console.error('Learning cycle initiation failed:', error);
      return { gaps: [], tasks: [], metrics: {} };
    }
  }

  async executeLearningTask(taskId: string): Promise<{
    success: boolean;
    result?: any;
    newKnowledge?: any[];
  }> {
    try {
      const { CurriculumEngine } = await import('./curriculum-engine');
      const curriculum = new CurriculumEngine(this.knowledgeBase, this.localAI);
      
      return await curriculum.executeLearningTask(taskId);
    } catch (error) {
      console.error(`Learning task ${taskId} execution failed:`, error);
      return { success: false };
    }
  }

  // Knowledge Graph methods
  async getKnowledgeGraph() {
    return this.knowledgeGraph;
  }

  async addKnowledge(content: string, type: string, metadata: any = {}, sources: string[] = []) {
    return await this.knowledgeGraph.addKnowledgeNode(
      content, 
      type as any, 
      metadata, 
      sources
    );
  }

  async getContradictions(severity?: string) {
    return this.knowledgeGraph.getContradictionsBySeverity(severity as any);
  }

  async getKnowledgeGraphData() {
    return this.knowledgeGraph.exportGraphData();
  }

  async resolveContradiction(contradictionId: string, resolution: string, proposedResolution?: string) {
    return await this.knowledgeGraph.resolveContradiction(
      contradictionId, 
      resolution as any, 
      proposedResolution
    );
  }

  // Helper methods for knowledge processing
  private inferDomain(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('science') || lowerContent.includes('research') || lowerContent.includes('experiment')) return 'science';
    if (lowerContent.includes('technology') || lowerContent.includes('software') || lowerContent.includes('computer')) return 'technology';
    if (lowerContent.includes('history') || lowerContent.includes('historical') || lowerContent.includes('ancient')) return 'history';
    if (lowerContent.includes('medical') || lowerContent.includes('health') || lowerContent.includes('disease')) return 'medicine';
    if (lowerContent.includes('economic') || lowerContent.includes('business') || lowerContent.includes('market')) return 'economics';
    if (lowerContent.includes('political') || lowerContent.includes('government') || lowerContent.includes('policy')) return 'politics';
    if (lowerContent.includes('art') || lowerContent.includes('music') || lowerContent.includes('culture')) return 'arts';
    if (lowerContent.includes('education') || lowerContent.includes('learning') || lowerContent.includes('teaching')) return 'education';
    
    return 'general';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    // Extract key terms that might be relevant tags
    const keyTerms = words.filter(word => 
      word.length > 4 && 
      !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
    );
    
    // Add up to 5 most relevant terms as tags
    tags.push(...keyTerms.slice(0, 5));
    
    return tags;
  }

  // Daily diff integration
  async generateDailyKnowledgeDiff(date?: string) {
    try {
      const { DailyKnowledgeDiffEngine } = await import('./daily-knowledge-diff');
      const diffEngine = new DailyKnowledgeDiffEngine(this.storage, this.knowledgeGraph, this.localAI);
      
      return await diffEngine.generateDailyDiff(date);
    } catch (error) {
      console.error('Failed to generate daily knowledge diff:', error);
      return null;
    }
  }

  // Source reputation methods
  async getSourceReputation() {
    return this.sourceReputation;
  }

  async verifyFactWithSources(factContent: string, sources: string[]) {
    return await this.sourceReputation.verifyFactWithSources(factContent, sources);
  }

  async getTopSources(limit?: number, domain?: string) {
    return this.sourceReputation.getTopSources(limit, domain);
  }

  async getReputationMetrics() {
    return this.sourceReputation.getReputationMetrics();
  }

  async getCurriculumMetrics() {
    const learningStats = await this.getLearningStats();
    return {
      totalGapsIdentified: learningStats.experiencesRecorded || 0,
      gapsResolved: learningStats.improvementCount || 0,
      learningEfficiency: learningStats.averagePerformance || 0.75,
      knowledgeGrowthRate: learningStats.experiencesRecorded > 0 ? learningStats.improvementCount / learningStats.experiencesRecorded : 0.5,
    };
  }

  // Self-learning methods
  async startAutonomousLearning() {
    return await this.selfLearningAgent.startLearningCycle();
  }

  async recordLearningExperience(
    taskType: string,
    input: string,
    expectedOutput: string,
    actualOutput: string,
    feedback: string,
    context: any
  ) {
    return await this.selfLearningAgent.recordLearningExperience(
      taskType, input, expectedOutput, actualOutput, feedback, context
    );
  }

  async getLearningStats() {
    return this.selfLearningAgent.getLearningStats();
  }

  async startIncrementalTraining() {
    try {
      const { IncrementalTrainingEngine } = await import('./incremental-training');
      const trainingEngine = new IncrementalTrainingEngine(
        this.storage, 
        this.localAI, 
        this.selfLearningAgent
      );
      
      return await trainingEngine.startIncrementalTraining();
    } catch (error) {
      console.error('Failed to start incremental training:', error);
      return null;
    }
  }

  // Enhanced goal execution with learning integration
  async executeGoalWithLearning(goal: string, context: any = {}, computeBudget: number = 60000): Promise<{
    tasks: LocalTask[];
    results: LocalExecutionResult[];
    verifiedFacts: LocalKnowledgeFact[];
    needsHumanReview: string[];
    totalCost: number;
    systemMetrics: any;
    learningExperiences: number;
    performanceImprovement: number;
  }> {
    console.log(`🧠 Enhanced goal execution with learning: ${goal}`);

    // Execute normal goal processing
    const standardResult = await this.executeGoal(goal, context, computeBudget);

    // Record learning experiences from the execution
    let learningExperiences = 0;
    for (const result of standardResult.results) {
      try {
        await this.recordLearningExperience(
          result.taskId,
          goal,
          'successful_completion',
          result.content,
          `Task completed with ${result.confidence} confidence`,
          {
            domain: this.inferDomain(result.content),
            difficulty: result.computeCost > 1000 ? 'hard' : 'medium',
            novelty: result.confidence < 0.8 ? 0.7 : 0.3,
            importance: result.confidence * 0.8
          }
        );
        learningExperiences++;
      } catch (error) {
        console.warn('Failed to record learning experience:', error);
      }
    }

    // Trigger autonomous learning if enough experiences accumulated
    let performanceImprovement = 0;
    if (learningExperiences > 2) {
      try {
        const learningResult = await this.startAutonomousLearning();
        performanceImprovement = learningResult.improvementsAchieved / learningResult.gapsIdentified;
        
        console.log(`📈 Learning triggered: ${learningResult.gapsIdentified} gaps, ${learningResult.improvementsAchieved} improvements`);
      } catch (error) {
        console.warn('Autonomous learning failed:', error);
      }
    }

    return {
      ...standardResult,
      learningExperiences,
      performanceImprovement
    };
  }

  // Consciousness backup and transfer methods
  async createConsciousnessSnapshot(description?: string) {
    return await this.consciousnessBackup.createSnapshot(description);
  }

  async restoreFromSnapshot(snapshotId: string) {
    return await this.consciousnessBackup.restoreFromSnapshot(snapshotId);
  }

  async transferConsciousness(targetSystem: any, protocol: any) {
    return await this.consciousnessBackup.transferConsciousness(targetSystem, protocol);
  }

  async getBackupStats() {
    return this.consciousnessBackup.getBackupStats();
  }

  async listSnapshots() {
    return this.consciousnessBackup.listSnapshots();
  }

  // Helper method to infer domain from content
  private inferDomain(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('math') || lowerContent.includes('calculation') || lowerContent.includes('number')) {
      return 'reasoning';
    } else if (lowerContent.includes('creative') || lowerContent.includes('story') || lowerContent.includes('metaphor')) {
      return 'creative';
    } else if (lowerContent.includes('fact') || lowerContent.includes('capital') || lowerContent.includes('date')) {
      return 'factual';
    } else {
      return 'general';
    }
  }
}