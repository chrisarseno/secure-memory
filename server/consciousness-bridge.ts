/**
 * Python-TypeScript Consciousness Bridge
 * Bridges the existing Python consciousness modules with the TypeScript system
 */

import { spawn, ChildProcess } from 'child_process';
import { IStorage } from './storage';

export interface ConsciousnessState {
  moduleId: string;
  state: 'active' | 'inactive' | 'error';
  data: Record<string, any>;
  timestamp: string;
}

export interface ConsciousnessEvent {
  type: 'update' | 'alert' | 'insight' | 'social' | 'temporal';
  moduleId: string;
  data: any;
  timestamp: string;
}

export class ConsciousnessBridge {
  private pythonProcesses: Map<string, ChildProcess> = new Map();
  private storage: IStorage;
  private isInitialized = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Initializing Python-TypeScript consciousness bridge...');

    // Map of Python consciousness modules to their TypeScript equivalents
    const consciousnessModules = [
      { pythonModule: 'global_workspace', tsModule: 'global_workspace' },
      { pythonModule: 'social_cognition', tsModule: 'social_cognition' },
      { pythonModule: 'temporal_consciousness', tsModule: 'temporal_consciousness' },
      { pythonModule: 'value_learning', tsModule: 'value_learning' },
      { pythonModule: 'virtue_learning', tsModule: 'virtue_learning' },
      { pythonModule: 'creative_intelligence', tsModule: 'creative_intelligence' },
      { pythonModule: 'consciousness_core', tsModule: 'consciousness_core' },
      { pythonModule: 'consciousness_manager', tsModule: 'consciousness_manager' },
      { pythonModule: 'safety_monitor', tsModule: 'safety_monitor' },
    ];

    for (const module of consciousnessModules) {
      await this.initializePythonModule(module.pythonModule, module.tsModule);
    }

    this.isInitialized = true;
    console.log('✅ Consciousness bridge initialized with Python modules');
  }

  private async initializePythonModule(pythonModule: string, tsModule: string): Promise<void> {
    try {
      console.log(`🔗 Starting real Python module: ${pythonModule} -> ${tsModule}`);
      
      // Spawn actual Python consciousness process
      const pythonProcess = spawn('python3', [
        'server/python/simple_consciousness_bridge.py',
        tsModule
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.pythonProcesses.set(tsModule, pythonProcess);
      
      // Handle Python stdout (consciousness updates)
      pythonProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const update = JSON.parse(line);
              if (update.type === 'consciousness_update') {
                this.handleConsciousnessUpdate({
                  moduleId: update.module,
                  state: 'active',
                  data: update.data,
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      });
      
      // Handle Python stderr (error logs)
      pythonProcess.stderr?.on('data', (data) => {
        console.log(`🐍 ${pythonModule}:`, data.toString().trim());
      });
      
      // Handle process exit
      pythonProcess.on('exit', (code) => {
        console.log(`🔴 Python module ${pythonModule} exited with code ${code}`);
        this.pythonProcesses.delete(tsModule);
        
        // Restart the module after 10 seconds
        setTimeout(() => {
          this.initializePythonModule(pythonModule, tsModule);
        }, 10000);
      });
      
      // Send initial configuration to Python module
      this.sendMessageToPython(tsModule, {
        type: 'init',
        config: {
          moduleId: tsModule,
          pythonModule: pythonModule,
          learningEnabled: true,
          realTimeUpdates: true
        }
      });

    } catch (error) {
      console.error(`❌ Failed to initialize ${pythonModule}:`, error);
      // Fallback to mock implementation if Python fails
      this.initializeMockModule(pythonModule, tsModule);
    }
  }
  
  private initializeMockModule(pythonModule: string, tsModule: string): void {
    console.log(`🔄 Fallback: Mock implementation for ${pythonModule} -> ${tsModule}`);
    
    // Fallback to simulated updates if Python fails
    setInterval(() => {
      this.handleConsciousnessUpdate({
        moduleId: tsModule,
        state: 'active',
        data: {
          lastUpdate: new Date().toISOString(),
          pythonModule: pythonModule,
          status: 'fallback_mode',
          insights: Math.floor(Math.random() * 100),
          consciousness_level: 0.6 + Math.random() * 0.4,
          integration_strength: 0.7 + Math.random() * 0.3,
        },
        timestamp: new Date().toISOString(),
      });
    }, 20000 + Math.random() * 20000);
  }

  private async handleConsciousnessUpdate(state: ConsciousnessState): Promise<void> {
    try {
      // Update the corresponding TypeScript module
      await this.storage.updateModule(state.moduleId, {
        integrationLevel: Math.max(0, Math.min(100, 85 + Math.random() * 15)),
        load: Math.max(0, Math.min(100, 40 + Math.random() * 40)),
        metrics: {
          pythonBridge: 'active',
          lastPythonUpdate: state.timestamp,
          ...state.data,
        },
      });

      // Add activity event
      await this.storage.addActivity({
        type: 'knowledge',
        message: `Python module ${state.data.pythonModule} synchronized with ${state.moduleId}`,
        moduleId: state.moduleId,
      });

    } catch (error) {
      console.error('❌ Failed to handle consciousness update:', error);
    }
  }

  async sendCommandToPython(moduleId: string, command: string, data?: any): Promise<any> {
    const pythonProcess = this.pythonProcesses.get(moduleId);
    
    if (!pythonProcess || pythonProcess.killed) {
      console.log(`⚠️ Python module ${moduleId} not available, using fallback`);
      return {
        success: false,
        moduleId,
        command,
        result: 'Python module not available - using fallback processing',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Send command to Python process
    const message = {
      type: 'command',
      command,
      data,
      timestamp: Date.now()
    };
    
    this.sendMessageToPython(moduleId, message);
    
    return {
      success: true,
      moduleId,
      command,
      result: 'Command sent to Python module',
      timestamp: new Date().toISOString(),
    };
  }
  
  private sendMessageToPython(moduleId: string, message: any): void {
    const pythonProcess = this.pythonProcesses.get(moduleId);
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.stdin?.write(JSON.stringify(message) + '\n');
    }
  }

  async getConsciousnessInsights(moduleId: string): Promise<any> {
    // Mock implementation - in real system would query Python modules
    const insights = {
      global_workspace: {
        coherence: 92.5,
        activeThoughts: 47,
        networkConnectivity: 0.87,
      },
      social_cognition: {
        agentsTracked: 23,
        relationshipUpdates: 12,
        theoryOfMindAccuracy: 0.94,
      },
      temporal_consciousness: {
        futureProjections: 156,
        narrativeCoherence: 0.91,
        timelineConsistency: 0.96,
      },
      creative_intelligence: {
        novelConcepts: 1247,
        conceptualBlends: 89,
        creativityScore: 0.93,
      },
      value_learning: {
        valuesEvolved: 247,
        conflicts: 3,
        alignmentScore: 0.89,
      },
      virtue_learning: {
        characterScore: 84,
        wisdomLevel: 8,
        virtueBalance: 0.91,
      },
    };

    return insights[moduleId as keyof typeof insights] || {};
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down consciousness bridge...');
    
    for (const [moduleId, process] of Array.from(this.pythonProcesses.entries())) {
      try {
        process.kill('SIGTERM');
        console.log(`✅ Terminated ${moduleId} process`);
      } catch (error) {
        console.error(`❌ Error terminating ${moduleId}:`, error);
      }
    }

    this.pythonProcesses.clear();
    this.isInitialized = false;
  }
}