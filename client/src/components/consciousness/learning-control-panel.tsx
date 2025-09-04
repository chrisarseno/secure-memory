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

interface LearningControlPanelProps {
  className?: string;
}

export default function LearningControlPanel({ className = "" }: LearningControlPanelProps) {
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<LearningStats | null>(null);
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

    return () => {
      socket.off('learning-progress');
      socket.off('training-status');
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

        {/* Recent Learning Activity */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Learning Activity
          </h4>
          <div className="text-sm text-muted-foreground p-3 bg-muted/10 rounded border-l-2 border-primary/50">
            {isLearningActive ? (
              <div className="flex items-center gap-2">
                <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Autonomous learning cycle in progress...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                <span>Ready to start autonomous learning</span>
              </div>
            )}
          </div>
        </div>

        {/* Learning Goals */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Learning Objectives</h4>
          <ScrollArea className="h-24">
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• Improve reasoning accuracy above 80%</div>
              <div>• Enhance creative output quality</div>
              <div>• Optimize response consistency</div>
              <div>• Develop better factual recall</div>
              <div>• Strengthen multi-modal understanding</div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}