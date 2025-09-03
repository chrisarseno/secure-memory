import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, Target, BookOpen, Zap, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LearningStats {
  totalExperiences: number;
  successRate: number;
  activeGaps: number;
  avgPerformanceScore: number;
  learningTrend: string;
  topPerformingDomains: string[];
  improvementOpportunities: string[];
}

export function SelfLearningPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLearning, setIsLearning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Fetch learning statistics
  const { data: learningStats, isLoading: statsLoading } = useQuery<LearningStats>({
    queryKey: ['/api/nexus/learning/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Start autonomous learning mutation
  const startLearningMutation = useMutation({
    mutationFn: () => apiRequest('/api/nexus/learning/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }),
    onMutate: () => setIsLearning(true),
    onSuccess: (data: any) => {
      setIsLearning(false);
      toast({
        title: "Learning Cycle Completed",
        description: `Identified ${data.gapsIdentified || 0} gaps, achieved ${data.improvementsAchieved || 0} improvements`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/learning/stats'] });
    },
    onError: (error: any) => {
      setIsLearning(false);
      toast({
        title: "Learning Failed",
        description: error.message || "Failed to start autonomous learning",
        variant: "destructive",
      });
    }
  });

  // Start incremental training mutation
  const startTrainingMutation = useMutation({
    mutationFn: () => apiRequest('/api/nexus/training/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }),
    onMutate: () => setIsTraining(true),
    onSuccess: (data: any) => {
      setIsTraining(false);
      toast({
        title: "Training Completed",
        description: `Processed ${data.batchesProcessed || 0} batches with ${((data.totalImprovement || 0) * 100).toFixed(1)}% improvement`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/learning/stats'] });
    },
    onError: (error: any) => {
      setIsTraining(false);
      toast({
        title: "Training Failed",
        description: error.message || "Failed to start incremental training",
        variant: "destructive",
      });
    }
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Self-Learning Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Self-Learning Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Performance Score</div>
              <div className="text-2xl font-bold">
                {((learningStats?.avgPerformanceScore || 0) * 100).toFixed(1)}%
              </div>
              <Progress 
                value={(learningStats?.avgPerformanceScore || 0) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-2xl font-bold">
                {((learningStats?.successRate || 0) * 100).toFixed(1)}%
              </div>
              <Progress 
                value={(learningStats?.successRate || 0) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Learning Trend</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTrendColor(learningStats?.learningTrend || 'stable')}`}>
                {getTrendIcon(learningStats?.learningTrend || 'stable')}
                {learningStats?.learningTrend || 'Stable'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Active Gaps</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {learningStats?.activeGaps || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Areas for improvement
              </div>
            </div>
          </div>

          <Separator />

          {/* Learning Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Actions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => startLearningMutation.mutate()}
                disabled={isLearning || startLearningMutation.isPending}
                className="h-20 flex flex-col gap-2"
                data-testid="button-start-learning"
              >
                <Brain className="h-6 w-6" />
                <span>
                  {isLearning ? 'Learning in Progress...' : 'Start Autonomous Learning'}
                </span>
                {isLearning && (
                  <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                    <div className="bg-white h-1 rounded-full animate-pulse"></div>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={() => startTrainingMutation.mutate()}
                disabled={isTraining || startTrainingMutation.isPending}
                variant="secondary"
                className="h-20 flex flex-col gap-2"
                data-testid="button-start-training"
              >
                <Zap className="h-6 w-6" />
                <span>
                  {isTraining ? 'Training in Progress...' : 'Start Incremental Training'}
                </span>
                {isTraining && (
                  <div className="w-full bg-gray-600/20 rounded-full h-1 mt-1">
                    <div className="bg-gray-600 h-1 rounded-full animate-pulse"></div>
                  </div>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Domain Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Domain Performance
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Top Performing Domains</div>
                <div className="flex flex-wrap gap-2">
                  {learningStats?.topPerformingDomains?.length ? (
                    learningStats.topPerformingDomains.map((domain) => (
                      <Badge 
                        key={domain} 
                        variant="default" 
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        {domain}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No data available</span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-2">Improvement Opportunities</div>
                <div className="flex flex-wrap gap-2">
                  {learningStats?.improvementOpportunities?.length ? (
                    learningStats.improvementOpportunities.map((opportunity) => (
                      <Badge 
                        key={opportunity} 
                        variant="secondary" 
                        className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      >
                        {opportunity}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No gaps identified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Learning Experiences</div>
              <div className="text-xl font-semibold">
                {learningStats?.totalExperiences || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">System Status</div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  (learningStats?.avgPerformanceScore || 0) > 0.8 
                    ? 'bg-green-500' 
                    : (learningStats?.avgPerformanceScore || 0) > 0.6 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}></div>
                <span className="text-sm">
                  {(learningStats?.avgPerformanceScore || 0) > 0.8 
                    ? 'Excellent Performance' 
                    : (learningStats?.avgPerformanceScore || 0) > 0.6 
                      ? 'Good Performance' 
                      : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}