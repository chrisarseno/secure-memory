import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, StopCircle, PlayCircle, PauseCircle } from "lucide-react";
import { ConsciousnessAPI } from "@/lib/consciousness-api";
import { useToast } from "@/hooks/use-toast";
import type { SafetyStatus } from "../../../../shared/schema";

interface SafetyStatusProps {
  showEmergencyControls?: boolean;
  className?: string;
}

export default function SafetyStatus({ showEmergencyControls = true, className = "" }: SafetyStatusProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch safety status
  const { data: safetyStatus, isLoading } = useQuery<SafetyStatus>({
    queryKey: ['/api/safety'],
    queryFn: ConsciousnessAPI.getSafetyStatus,
    refetchInterval: 5000, // More frequent updates for safety
  });

  // Emergency actions
  const emergencyActionMutation = useMutation({
    mutationFn: (action: { action: "pause" | "stop" | "quarantine" | "override"; reason: string }) =>
      ConsciousnessAPI.executeEmergencyAction(action),
    onSuccess: (data) => {
      const actionLabels: Record<string, string> = {
        stop: "Emergency Stop",
        pause: "System Pause",
        quarantine: "Quarantine",
        override: "Override"
      };
      
      toast({
        title: `${actionLabels[data.action] || 'Action'} Executed`,
        description: `Action completed: ${data.reason}`,
        variant: data.action === 'stop' ? 'destructive' : 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/safety'] });
    },
    onError: () => {
      toast({
        title: "Action Failed",
        description: "Unable to execute emergency action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const executeEmergencyAction = (action: string, reason: string) => {
    const confirmMessages: Record<string, string> = {
      stop: 'Are you sure you want to emergency stop the AGI system? This will halt all consciousness processes.',
      pause: 'Are you sure you want to pause the AGI system?',
      quarantine: 'Are you sure you want to quarantine suspicious modules?'
    };

    if (confirm(confirmMessages[action] || 'Are you sure you want to execute this action?')) {
      emergencyActionMutation.mutate({ action, reason });
    }
  };

  const getStatusColor = (value: number, threshold: number = 90) => {
    if (value >= threshold) return 'accent';
    if (value >= threshold - 10) return 'chart-3';
    return 'destructive';
  };

  const getStatusIndicator = (value: number, threshold: number = 90) => {
    if (value >= threshold) return 'bg-accent';
    if (value >= threshold - 10) return 'bg-chart-3';
    return 'bg-destructive';
  };

  if (isLoading) {
    return (
      <Card className={`bg-card border-border ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Loading safety status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safety Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="safety-monitor">
          {/* Safety Metrics */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ethical Compliance</span>
                <span className="font-medium" data-testid="ethical-compliance-value">
                  {safetyStatus?.ethicalCompliance?.toFixed(1) || 0}%
                </span>
              </div>
              <Progress 
                value={safetyStatus?.ethicalCompliance || 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Value Alignment</span>
                <span className="font-medium" data-testid="value-alignment-value">
                  {safetyStatus?.valueAlignment?.toFixed(1) || 0}%
                </span>
              </div>
              <Progress 
                value={safetyStatus?.valueAlignment || 0} 
                className="h-2"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Safety Constraints</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${safetyStatus?.safetyConstraints ? 'bg-accent' : 'bg-destructive'} rounded-full`}></div>
                <span className="text-sm font-medium" data-testid="safety-constraints-status">
                  {safetyStatus?.safetyConstraints ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quarantine Queue</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${(safetyStatus?.quarantineQueueSize || 0) > 0 ? 'bg-destructive' : 'bg-accent'} rounded-full`}></div>
                <span className="text-sm font-medium" data-testid="quarantine-queue-size">
                  {safetyStatus?.quarantineQueueSize || 0} items
                </span>
              </div>
            </div>
          </div>
        
          {/* Safety Alerts */}
          {safetyStatus?.quarantineQueueSize && safetyStatus.quarantineQueueSize > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Safety Alert</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {safetyStatus.quarantineQueueSize} item{safetyStatus.quarantineQueueSize !== 1 ? 's' : ''} require{safetyStatus.quarantineQueueSize === 1 ? 's' : ''} safety review
              </p>
            </div>
          )}

          {/* Emergency Controls */}
          {showEmergencyControls && (
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => executeEmergencyAction('pause', 'Manual pause for safety review')}
                  disabled={emergencyActionMutation.isPending}
                  data-testid="button-pause-system"
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => executeEmergencyAction('quarantine', 'Manual quarantine of suspicious modules')}
                  disabled={emergencyActionMutation.isPending}
                  data-testid="button-quarantine"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Quarantine
                </Button>
              </div>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => executeEmergencyAction('stop', 'Manual emergency stop activated by user')}
                disabled={emergencyActionMutation.isPending}
                data-testid="button-emergency-stop"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                {emergencyActionMutation.isPending ? 'Executing...' : 'Emergency Stop'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
