import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Play, 
  Pause, 
  BarChart3, 
  Target, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { initializeSocket } from "@/lib/socket";

interface LearningStats {
  isActive: boolean;
  currentScore: number;
  gapsIdentified: number;
  improvementsAchieved: number;
  totalSessions: number;
  recentImprovement: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

interface LearningActivity {
  id: string;
  phase: 'gap_identification' | 'task_generation' | 'research' | 'practice' | 'verification' | 'training' | 'consolidation';
  description: string;
  progress: number;
  domain?: string;
  estimatedTime?: number;
  startedAt: string;
  details?: any;
}

interface LearningGap {
  id: string;
  domain: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  difficulty: number;
  status: 'identified' | 'active' | 'resolved';
}

interface TrainingBatch {
  id: string;
  domain: string;
  batchSize: number;
  progress: number;
  learningRate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface LearningControlPanelProps {
  className?: string;
}

export default function LearningControlPanel({ className = "" }: LearningControlPanelProps) {
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<LearningStats | null>(null);
  const [currentActivities, setCurrentActivities] = useState<LearningActivity[]>([]);
  const [activeLearningGaps, setActiveLearningGaps] = useState<LearningGap[]>([]);
  const [trainingBatches, setTrainingBatches] = useState<TrainingBatch[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize WebSocket connection for real-time learning updates
  useEffect(() => {
    const socket = initializeSocket();
    
    socket.on('learning-progress', (progress: LearningStats) => {
      setRealTimeStats(progress);
      setIsLearningActive(progress.isActive);
    });

    socket.on('training-status', (status: any) => {
      if (status.active) {
        setIsLearningActive(true);
      }
    });

    // Enhanced real-time learning activity updates
    socket.on('learning-activity', (activity: LearningActivity) => {
      setCurrentActivities(prev => {
        const updated = prev.filter(a => a.id !== activity.id);
        if (activity.progress < 100) {
          updated.push(activity);
        }
        return updated.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      });
    });

    socket.on('learning-phase-change', (data: { phase: string, description: string }) => {
      setCurrentPhase(data.phase);
    });

    socket.on('learning-gaps-update', (gaps: LearningGap[]) => {
      setActiveLearningGaps(gaps);
    });

    socket.on('training-batches-update', (batches: TrainingBatch[]) => {
      setTrainingBatches(batches);
    });

    return () => {
      socket.off('learning-progress');
      socket.off('training-status');
      socket.off('learning-activity');
      socket.off('learning-phase-change');
      socket.off('learning-gaps-update');
      socket.off('training-batches-update');
    };
  }, []);

  // Fetch learning stats
  const { data: stats, isLoading } = useQuery<LearningStats>({
    queryKey: ['/api/nexus/learning/stats'],
    queryFn: async () => {
      const response = await fetch('/api/nexus/learning/stats');
      if (!response.ok) throw new Error('Failed to fetch learning stats');
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Start learning mutation
  const startLearningMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/nexus/learning/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start learning');
      return response.json();
    },
    onSuccess: (data) => {
      setIsLearningActive(true);
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/learning/stats'] });
      toast({
        title: "Learning Started",
        description: `Started autonomous learning cycle with ${data.gapsIdentified} areas to improve`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start Learning",
        description: "Could not start autonomous learning system",
        variant: "destructive",
      });
    },
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/nexus/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start training');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/learning/stats'] });
      toast({
        title: "Training Started",
        description: "Started incremental training for continuous improvement",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start Training",
        description: "Could not start incremental training system",
        variant: "destructive",
      });
    },
  });

  // Use real-time stats if available, otherwise fall back to fetched stats
  const currentStats = realTimeStats || stats;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Self-Learning Agent
          </div>
          <Badge 
            variant={isLearningActive ? "default" : "secondary"}
            className="text-xs"
          >
            {isLearningActive ? "Learning Active" : "Waiting"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Current Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(currentStats?.currentScore || 0) * 100} 
                className="flex-1"
                data-testid="progress-performance"
              />
              <span className="text-sm text-muted-foreground">
                {((currentStats?.currentScore || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getTrendIcon(currentStats?.trendDirection || 'stable')}
              <span className="text-sm font-medium">Learning Trend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getTrendColor(currentStats?.trendDirection || 'stable')}`}>
                {currentStats?.trendDirection || 'stable'}
              </span>
              <Badge variant="outline" className="text-xs">
                {currentStats?.recentImprovement ? 
                  `${(currentStats.recentImprovement * 100).toFixed(1)}%` : 
                  '0%'
                }
              </Badge>
            </div>
          </div>
        </div>

        {/* Learning Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentStats?.gapsIdentified || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Knowledge Gaps
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentStats?.improvementsAchieved || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Improvements
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentStats?.totalSessions || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Training Sessions
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => startLearningMutation.mutate()}
            disabled={startLearningMutation.isPending || isLearningActive}
            className="flex-1"
            data-testid="button-start-learning"
          >
            {startLearningMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Learning Cycle
          </Button>
          
          <Button
            onClick={() => startTrainingMutation.mutate()}
            disabled={startTrainingMutation.isPending}
            variant="outline"
            className="flex-1"
            data-testid="button-start-training"
          >
            {startTrainingMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Start Training
          </Button>
        </div>

        {/* Real-Time Learning Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Current Learning Activity
          </h4>
          
          {/* Current Phase */}
          <div className="text-sm p-3 bg-muted/10 rounded border-l-2 border-primary/50">
            {isLearningActive ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {currentPhase === 'idle' ? 'Learning Cycle Active' : currentPhase.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {currentActivities.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Currently: {currentActivities[0]?.description}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                <span>Ready to start autonomous learning</span>
              </div>
            )}
          </div>

          {/* Active Learning Activities */}
          {currentActivities.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">Active Tasks</h5>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {currentActivities.map((activity) => (
                    <div key={activity.id} className="text-xs border rounded p-2 bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{activity.phase.replace('_', ' ')}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.domain}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{activity.description}</p>
                      <Progress value={activity.progress} className="h-1" />
                      <div className="flex justify-between mt-1">
                        <span>{activity.progress}%</span>
                        {activity.estimatedTime && (
                          <span>{activity.estimatedTime}min remaining</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Active Learning Gaps */}
          {activeLearningGaps.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">Learning Gaps Being Addressed</h5>
              <div className="space-y-1">
                {activeLearningGaps.slice(0, 3).map((gap) => (
                  <div key={gap.id} className="text-xs flex items-center justify-between">
                    <span>{gap.domain}: {gap.description}</span>
                    <Badge 
                      variant={gap.priority === 'high' ? 'destructive' : gap.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {gap.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Training Batches */}
          {trainingBatches.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">Training Batches</h5>
              <div className="space-y-1">
                {trainingBatches.map((batch) => (
                  <div key={batch.id} className="text-xs flex items-center justify-between">
                    <span>{batch.domain} ({batch.batchSize} examples)</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        batch.status === 'completed' ? 'bg-green-500' :
                        batch.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                        batch.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span>{batch.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Learning Goals */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Learning Objectives</h4>
          <ScrollArea className="h-24">
            <div className="space-y-1 text-xs text-muted-foreground">
              {activeLearningGaps.length > 0 ? (
                activeLearningGaps.map((gap) => (
                  <div key={gap.id} className="flex items-center justify-between">
                    <span>• {gap.description}</span>
                    <Badge 
                      variant={gap.status === 'resolved' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {gap.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  <div>• Improve reasoning accuracy above 80%</div>
                  <div>• Enhance creative output quality</div>
                  <div>• Optimize response consistency</div>
                  <div>• Develop better factual recall</div>
                  <div>• Strengthen multi-modal understanding</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}