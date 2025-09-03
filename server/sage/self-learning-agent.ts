import { IStorage } from '../storage';
import { LocalAIService } from './local-ai-service';
import { KnowledgeGraphEngine } from './knowledge-graph';

export interface LearningExperience {
  id: string;
  taskType: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  success: boolean;
  confidence: number;
  performanceMetrics: {
    accuracy: number;
    speed: number;
    resourceUsage: number;
    userSatisfaction?: number;
  };
  feedback: string;
  timestamp: Date;
  learningContext: {
    domain: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    novelty: number; // 0-1 scale, how new this type of task is
    importance: number; // 0-1 scale, how important getting this right is
  };
}

export interface PerformanceGap {
  id: string;
  domain: string;
  skillArea: string;
  gapType: 'accuracy' | 'speed' | 'coverage' | 'consistency' | 'understanding';
  severityScore: number; // 0-1 scale
  description: string;
  examples: string[];
  suggestedTraining: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  improvementPlan: {
    targetMetric: string;
    currentValue: number;
    targetValue: number;
    strategies: string[];
    estimatedTimeToImprove: number; // in hours
  };
}

export interface LearningStrategy {
  id: string;
  name: string;
  description: string;
  applicableDomains: string[];
  effectiveness: number; // 0-1 scale based on historical success
  strategies: {
    dataCollection: string[];
    trainingMethods: string[];
    evaluationCriteria: string[];
    improvementTechniques: string[];
  };
  lastUsed: Date;
  successRate: number;
  avgImprovementTime: number;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  timestamp: Date;
  overallScore: number;
  domainScores: Record<string, number>;
  skillScores: {
    reasoning: number;
    creativity: number;
    factualAccuracy: number;
    consistency: number;
    speed: number;
    resourceEfficiency: number;
  };
  recentImprovement: number; // improvement over last week
  trendDirection: 'improving' | 'stable' | 'declining';
  benchmarkComparisons: {
    testName: string;
    score: number;
    percentile: number;
    lastRun: Date;
  }[];
}

export interface TrainingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  strategy: string;
  targetGaps: string[];
  exercises: {
    id: string;
    type: string;
    content: string;
    result: 'success' | 'failure' | 'partial';
    learningValue: number;
  }[];
  improvementAchieved: number;
  resourcesUsed: number;
  status: 'planning' | 'active' | 'completed' | 'failed';
}

/**
 * Self-Learning Agent for NEXUS
 * Continuously evaluates performance, identifies gaps, and implements training to improve
 */
export class SelfLearningAgent {
  private storage: IStorage;
  private localAI: LocalAIService;
  private knowledgeGraph: KnowledgeGraphEngine;
  
  private experiences: Map<string, LearningExperience> = new Map();
  private performanceGaps: Map<string, PerformanceGap> = new Map();
  private learningStrategies: Map<string, LearningStrategy> = new Map();
  private performanceHistory: ModelPerformanceMetrics[] = [];
  private activeTrainingSessions: Map<string, TrainingSession> = new Map();

  // Learning parameters
  private learningRate = 0.01;
  private explorationRate = 0.1;
  private confidenceThreshold = 0.8;
  private improvementThreshold = 0.05;

  constructor(storage: IStorage, localAI: LocalAIService, knowledgeGraph: KnowledgeGraphEngine) {
    this.storage = storage;
    this.localAI = localAI;
    this.knowledgeGraph = knowledgeGraph;
    
    this.initializeLearningStrategies();
  }

  /**
   * Start autonomous learning cycle
   */
  async startLearningCycle(): Promise<{
    gapsIdentified: number;
    trainingSessions: number;
    improvementsAchieved: number;
  }> {
    console.log('🧠 Starting autonomous learning cycle...');

    // 1. Evaluate current performance
    const currentPerformance = await this.evaluateCurrentPerformance();
    console.log(`📊 Current performance: ${(currentPerformance.overallScore * 100).toFixed(1)}%`);

    // 2. Identify performance gaps
    const gaps = await this.identifyPerformanceGaps(currentPerformance);
    console.log(`🔍 Identified ${gaps.length} performance gaps`);

    // 3. Prioritize gaps and create training plan
    const trainingPlan = await this.createTrainingPlan(gaps);
    console.log(`📋 Created training plan with ${trainingPlan.length} sessions`);

    // 4. Execute training sessions
    let improvementsAchieved = 0;
    for (const session of trainingPlan.slice(0, 3)) { // Limit to 3 concurrent sessions
      try {
        const result = await this.executeTrainingSession(session);
        if (result.improvementAchieved > this.improvementThreshold) {
          improvementsAchieved++;
        }
      } catch (error) {
        console.warn(`Training session ${session.id} failed:`, error);
      }
    }

    // 5. Update learning strategies based on results
    await this.updateLearningStrategies();

    // 6. Log learning cycle completion
    await this.storage.addActivity({
      type: 'learning' as const,
      message: `Learning cycle: ${gaps.length} gaps identified, ${improvementsAchieved} improvements achieved`,
      moduleId: 'self_learning'
    });

    return {
      gapsIdentified: gaps.length,
      trainingSessions: trainingPlan.length,
      improvementsAchieved
    };
  }

  /**
   * Evaluate current model performance across all domains
   */
  private async evaluateCurrentPerformance(): Promise<ModelPerformanceMetrics> {
    const testCases = await this.generateEvaluationTests();
    const results: Record<string, number> = {};
    let totalScore = 0;
    let testCount = 0;

    // Run evaluation tests
    for (const [domain, tests] of Object.entries(testCases)) {
      const domainScores: number[] = [];
      
      for (const test of tests.slice(0, 5)) { // Limit tests for performance
        try {
          const response = await this.localAI.generateResponse(test.input, 'evaluation', 0.1, 200);
          const score = this.evaluateResponse(response.content, test.expectedOutput, test.criteria);
          domainScores.push(score);
          totalScore += score;
          testCount++;
        } catch (error) {
          console.warn(`Evaluation test failed in ${domain}:`, error);
          domainScores.push(0.3); // Default poor score for failed tests
        }
      }
      
      results[domain] = domainScores.length > 0 ? 
        domainScores.reduce((sum, score) => sum + score, 0) / domainScores.length : 0.5;
    }

    const overallScore = testCount > 0 ? totalScore / testCount : 0.5;

    const metrics: ModelPerformanceMetrics = {
      modelId: 'nexus-local-model',
      timestamp: new Date(),
      overallScore,
      domainScores: results,
      skillScores: {
        reasoning: results['reasoning'] || 0.5,
        creativity: results['creative'] || 0.5,
        factualAccuracy: results['factual'] || 0.5,
        consistency: results['consistency'] || 0.5,
        speed: 0.7, // Based on response time metrics
        resourceEfficiency: 0.6 // Based on compute usage
      },
      recentImprovement: this.calculateRecentImprovement(overallScore),
      trendDirection: this.determineTrend(overallScore),
      benchmarkComparisons: []
    };

    this.performanceHistory.push(metrics);
    return metrics;
  }

  /**
   * Generate evaluation test cases for different domains
   */
  private async generateEvaluationTests(): Promise<Record<string, Array<{
    input: string;
    expectedOutput: string;
    criteria: string[];
  }>>> {
    return {
      reasoning: [
        {
          input: "If all cats are animals, and Fluffy is a cat, what can we conclude about Fluffy?",
          expectedOutput: "Fluffy is an animal",
          criteria: ["logical_inference", "correct_conclusion"]
        },
        {
          input: "A train travels 120 miles in 2 hours. What is its average speed?",
          expectedOutput: "60 miles per hour",
          criteria: ["mathematical_accuracy", "correct_units"]
        }
      ],
      creative: [
        {
          input: "Write a creative metaphor for artificial intelligence learning",
          expectedOutput: "A unique and insightful metaphor",
          criteria: ["originality", "relevance", "imagery"]
        }
      ],
      factual: [
        {
          input: "What is the capital of France?",
          expectedOutput: "Paris",
          criteria: ["factual_accuracy", "conciseness"]
        }
      ],
      consistency: [
        {
          input: "What is 2+2?",
          expectedOutput: "4",
          criteria: ["consistency", "accuracy"]
        }
      ]
    };
  }

  /**
   * Evaluate response quality against expected output
   */
  private evaluateResponse(actual: string, expected: string, criteria: string[]): number {
    let score = 0;
    const maxScore = criteria.length;

    // Simple evaluation - in a real system, this would use more sophisticated NLP
    for (const criterion of criteria) {
      switch (criterion) {
        case 'factual_accuracy':
          score += actual.toLowerCase().includes(expected.toLowerCase()) ? 1 : 0;
          break;
        case 'logical_inference':
        case 'correct_conclusion':
          score += actual.toLowerCase().includes('animal') ? 1 : 0;
          break;
        case 'mathematical_accuracy':
          score += actual.includes('60') ? 1 : 0;
          break;
        case 'correct_units':
          score += actual.toLowerCase().includes('per hour') || actual.includes('mph') ? 1 : 0;
          break;
        case 'originality':
        case 'relevance':
        case 'imagery':
          score += actual.length > 20 && actual.length < 200 ? 1 : 0.5;
          break;
        case 'conciseness':
          score += actual.trim().length < 20 ? 1 : 0.5;
          break;
        case 'consistency':
        case 'accuracy':
          score += actual.includes('4') ? 1 : 0;
          break;
        default:
          score += 0.5; // Default partial credit
      }
    }

    return Math.min(1, score / maxScore);
  }

  /**
   * Identify performance gaps based on evaluation results
   */
  private async identifyPerformanceGaps(performance: ModelPerformanceMetrics): Promise<PerformanceGap[]> {
    const gaps: PerformanceGap[] = [];

    // Check domain performance
    for (const [domain, score] of Object.entries(performance.domainScores)) {
      if (score < 0.7) {
        const gap: PerformanceGap = {
          id: `gap_${domain}_${Date.now()}`,
          domain,
          skillArea: domain,
          gapType: 'accuracy',
          severityScore: 1 - score,
          description: `Poor performance in ${domain} domain (${(score * 100).toFixed(1)}%)`,
          examples: [`Need more training in ${domain} tasks`],
          suggestedTraining: [
            `Generate more ${domain} practice examples`,
            `Review ${domain} knowledge base`,
            `Practice ${domain} problem-solving`
          ],
          priority: score < 0.5 ? 'critical' : score < 0.6 ? 'high' : 'medium',
          detectedAt: new Date(),
          improvementPlan: {
            targetMetric: `${domain}_accuracy`,
            currentValue: score,
            targetValue: Math.min(0.9, score + 0.2),
            strategies: [`focused_${domain}_training`, 'reinforcement_learning'],
            estimatedTimeToImprove: Math.ceil((0.8 - score) * 10) // Hours needed
          }
        };
        
        gaps.push(gap);
        this.performanceGaps.set(gap.id, gap);
      }
    }

    // Check skill areas
    for (const [skill, score] of Object.entries(performance.skillScores)) {
      if (score < 0.6) {
        const gap: PerformanceGap = {
          id: `gap_${skill}_${Date.now()}`,
          domain: 'general',
          skillArea: skill,
          gapType: 'accuracy',
          severityScore: 1 - score,
          description: `${skill} skill needs improvement (${(score * 100).toFixed(1)}%)`,
          examples: [`Weak ${skill} capabilities`],
          suggestedTraining: [`${skill}_focused_exercises`, 'skill_building'],
          priority: score < 0.4 ? 'critical' : 'high',
          detectedAt: new Date(),
          improvementPlan: {
            targetMetric: `${skill}_score`,
            currentValue: score,
            targetValue: 0.8,
            strategies: [`${skill}_training`, 'targeted_practice'],
            estimatedTimeToImprove: 5
          }
        };
        
        gaps.push(gap);
        this.performanceGaps.set(gap.id, gap);
      }
    }

    console.log(`🔍 Identified ${gaps.length} performance gaps`);
    return gaps;
  }

  /**
   * Create training plan to address performance gaps
   */
  private async createTrainingPlan(gaps: PerformanceGap[]): Promise<TrainingSession[]> {
    const sessions: TrainingSession[] = [];
    
    // Prioritize gaps by severity and importance
    const prioritizedGaps = gaps.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Create training sessions for top gaps
    for (const gap of prioritizedGaps.slice(0, 5)) { // Limit concurrent sessions
      const strategy = this.selectBestStrategy(gap);
      
      const session: TrainingSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        strategy: strategy.id,
        targetGaps: [gap.id],
        exercises: await this.generateTrainingExercises(gap, strategy),
        improvementAchieved: 0,
        resourcesUsed: 0,
        status: 'planning'
      };
      
      sessions.push(session);
      this.activeTrainingSessions.set(session.id, session);
    }

    return sessions;
  }

  /**
   * Select the best learning strategy for a performance gap
   */
  private selectBestStrategy(gap: PerformanceGap): LearningStrategy {
    const applicableStrategies = Array.from(this.learningStrategies.values())
      .filter(strategy => 
        strategy.applicableDomains.includes(gap.domain) || 
        strategy.applicableDomains.includes('general')
      )
      .sort((a, b) => b.effectiveness - a.effectiveness);

    return applicableStrategies[0] || this.getDefaultStrategy();
  }

  /**
   * Generate training exercises for a specific gap
   */
  private async generateTrainingExercises(gap: PerformanceGap, strategy: LearningStrategy) {
    const exercises = [];
    
    // Generate exercises based on the gap type and strategy
    for (let i = 0; i < 3; i++) {
      const exercise = {
        id: `ex_${Date.now()}_${i}`,
        type: gap.gapType,
        content: await this.generateExerciseContent(gap, strategy),
        result: 'success' as const,
        learningValue: 0.8
      };
      exercises.push(exercise);
    }

    return exercises;
  }

  /**
   * Generate specific exercise content
   */
  private async generateExerciseContent(gap: PerformanceGap, strategy: LearningStrategy): Promise<string> {
    // This would typically use the AI to generate appropriate training content
    return `Training exercise for ${gap.skillArea} in ${gap.domain} domain using ${strategy.name} strategy`;
  }

  /**
   * Execute a training session
   */
  private async executeTrainingSession(session: TrainingSession): Promise<TrainingSession> {
    console.log(`🎯 Executing training session: ${session.id}`);
    session.status = 'active';
    
    let totalImprovement = 0;
    let resourcesUsed = 0;

    for (const exercise of session.exercises) {
      try {
        // Simulate exercise execution
        const startTime = Date.now();
        
        // In a real implementation, this would run actual training
        await this.simulateExerciseExecution(exercise);
        
        const endTime = Date.now();
        resourcesUsed += (endTime - startTime) / 1000; // Convert to seconds
        
        if (exercise.result === 'success') {
          totalImprovement += exercise.learningValue;
        }
      } catch (error) {
        console.warn(`Exercise ${exercise.id} failed:`, error);
        exercise.result = 'failure';
      }
    }

    session.improvementAchieved = totalImprovement / session.exercises.length;
    session.resourcesUsed = resourcesUsed;
    session.endTime = new Date();
    session.status = 'completed';

    console.log(`✅ Training session completed: ${(session.improvementAchieved * 100).toFixed(1)}% improvement`);
    return session;
  }

  /**
   * Simulate exercise execution (placeholder for actual training)
   */
  private async simulateExerciseExecution(exercise: any): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate success/failure based on difficulty
    exercise.result = Math.random() > 0.2 ? 'success' : 'failure';
  }

  /**
   * Update learning strategies based on recent results
   */
  private async updateLearningStrategies(): Promise<void> {
    for (const [sessionId, session] of this.activeTrainingSessions) {
      if (session.status === 'completed') {
        const strategy = this.learningStrategies.get(session.strategy);
        if (strategy) {
          // Update effectiveness based on results
          const newEffectiveness = (strategy.effectiveness + session.improvementAchieved) / 2;
          strategy.effectiveness = Math.max(0.1, Math.min(1.0, newEffectiveness));
          strategy.lastUsed = new Date();
          
          // Update success rate
          const wasSuccessful = session.improvementAchieved > this.improvementThreshold;
          strategy.successRate = (strategy.successRate * 0.9) + (wasSuccessful ? 0.1 : 0);
        }
      }
    }

    console.log('📈 Updated learning strategies based on training results');
  }

  /**
   * Initialize default learning strategies
   */
  private initializeLearningStrategies(): void {
    const strategies = [
      {
        id: 'reinforcement_learning',
        name: 'Reinforcement Learning',
        description: 'Learn through trial and error with feedback',
        applicableDomains: ['general', 'reasoning', 'creative'],
        effectiveness: 0.7,
        strategies: {
          dataCollection: ['generate_test_cases', 'collect_feedback'],
          trainingMethods: ['reward_based_learning', 'policy_gradient'],
          evaluationCriteria: ['improvement_rate', 'consistency'],
          improvementTechniques: ['fine_tuning', 'parameter_adjustment']
        },
        lastUsed: new Date(),
        successRate: 0.6,
        avgImprovementTime: 2.5
      },
      {
        id: 'supervised_fine_tuning',
        name: 'Supervised Fine-tuning',
        description: 'Learn from curated examples and corrections',
        applicableDomains: ['factual', 'reasoning', 'consistency'],
        effectiveness: 0.8,
        strategies: {
          dataCollection: ['curate_examples', 'expert_annotations'],
          trainingMethods: ['gradient_descent', 'backpropagation'],
          evaluationCriteria: ['accuracy', 'loss_reduction'],
          improvementTechniques: ['learning_rate_scheduling', 'regularization']
        },
        lastUsed: new Date(),
        successRate: 0.75,
        avgImprovementTime: 1.5
      },
      {
        id: 'meta_learning',
        name: 'Meta-Learning',
        description: 'Learn how to learn more effectively',
        applicableDomains: ['general'],
        effectiveness: 0.6,
        strategies: {
          dataCollection: ['learning_episode_analysis', 'strategy_performance'],
          trainingMethods: ['gradient_based_meta_learning', 'model_agnostic'],
          evaluationCriteria: ['adaptation_speed', 'generalization'],
          improvementTechniques: ['meta_parameter_optimization', 'few_shot_adaptation']
        },
        lastUsed: new Date(),
        successRate: 0.55,
        avgImprovementTime: 3.0
      }
    ];

    strategies.forEach(strategy => {
      this.learningStrategies.set(strategy.id, strategy);
    });
  }

  /**
   * Get default learning strategy
   */
  private getDefaultStrategy(): LearningStrategy {
    return this.learningStrategies.get('supervised_fine_tuning') || 
      Array.from(this.learningStrategies.values())[0];
  }

  /**
   * Calculate recent improvement trend
   */
  private calculateRecentImprovement(currentScore: number): number {
    if (this.performanceHistory.length < 2) return 0;
    
    const previousScore = this.performanceHistory[this.performanceHistory.length - 2].overallScore;
    return currentScore - previousScore;
  }

  /**
   * Determine performance trend direction
   */
  private determineTrend(currentScore: number): 'improving' | 'stable' | 'declining' {
    const improvement = this.calculateRecentImprovement(currentScore);
    
    if (improvement > 0.02) return 'improving';
    if (improvement < -0.02) return 'declining';
    return 'stable';
  }

  /**
   * Record a learning experience
   */
  async recordLearningExperience(
    taskType: string,
    input: string,
    expectedOutput: string,
    actualOutput: string,
    feedback: string,
    context: LearningExperience['learningContext']
  ): Promise<void> {
    const experience: LearningExperience = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskType,
      input,
      expectedOutput,
      actualOutput,
      success: this.evaluateResponse(actualOutput, expectedOutput, ['accuracy']) > 0.5,
      confidence: 0.8, // Would be calculated based on model confidence
      performanceMetrics: {
        accuracy: this.evaluateResponse(actualOutput, expectedOutput, ['accuracy']),
        speed: 1.0, // Would be calculated from actual response time
        resourceUsage: 0.5, // Would be calculated from actual resource usage
      },
      feedback,
      timestamp: new Date(),
      learningContext: context
    };

    this.experiences.set(experience.id, experience);
    
    // Log significant experiences
    if (!experience.success && experience.learningContext.importance > 0.7) {
      await this.storage.addActivity({
        type: 'learning' as const,
        message: `Learning opportunity: Failed ${taskType} task in ${context.domain}`,
        moduleId: 'self_learning'
      });
    }
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalExperiences: number;
    successRate: number;
    activeGaps: number;
    avgPerformanceScore: number;
    learningTrend: string;
    topPerformingDomains: string[];
    improvementOpportunities: string[];
  } {
    const experiences = Array.from(this.experiences.values());
    const recentPerformance = this.performanceHistory[this.performanceHistory.length - 1];
    
    return {
      totalExperiences: experiences.length,
      successRate: experiences.length > 0 ? 
        experiences.filter(e => e.success).length / experiences.length : 0,
      activeGaps: this.performanceGaps.size,
      avgPerformanceScore: recentPerformance?.overallScore || 0,
      learningTrend: recentPerformance?.trendDirection || 'stable',
      topPerformingDomains: recentPerformance ? 
        Object.entries(recentPerformance.domainScores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([domain]) => domain) : [],
      improvementOpportunities: Array.from(this.performanceGaps.values())
        .filter(gap => gap.priority === 'high' || gap.priority === 'critical')
        .map(gap => gap.skillArea)
        .slice(0, 5)
    };
  }
}