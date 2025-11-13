import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, StopCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SafetyStatus } from "../../../shared/schema";

export default function SafetyMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch safety status
  const { data: safetyStatus } = useQuery<SafetyStatus>({
    queryKey: ['/api/safety'],
    refetchInterval: 5000, // More frequent updates for safety
  });

  // Emergency stop mutation
  const emergencyStopMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          reason: 'Manual emergency stop activated by user',
        }),
      }),
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All consciousness systems have been safely halted.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/safety'] });
    },
    onError: () => {
      toast({
        title: "Emergency Stop Failed",
        description: "Unable to execute emergency stop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEmergencyStop = () => {
    if (confirm('Are you sure you want to emergency stop the AGI system? This will halt all consciousness processes.')) {
      emergencyStopMutation.mutate();
    }
  };

  const getStatusColor = (value: number, threshold: number = 90) => {
    if (value >= threshold) return 'accent';
    if (value >= threshold - 10) return 'chart-3';
    return 'destructive';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safety Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="safety-monitor">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ethical Compliance</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 bg-${getStatusColor(safetyStatus?.ethicalCompliance || 0)} rounded-full`}></div>
              <span className="text-sm font-medium" data-testid="ethical-compliance-value">
                {safetyStatus?.ethicalCompliance?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Value Alignment</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 bg-${getStatusColor(safetyStatus?.valueAlignment || 0, 80)} rounded-full`}></div>
              <span className="text-sm font-medium" data-testid="value-alignment-value">
                {safetyStatus?.valueAlignment?.toFixed(1) || 0}%
              </span>
            </div>
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
        
        {safetyStatus?.quarantineQueueSize && safetyStatus.quarantineQueueSize > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Safety Alert</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {safetyStatus.quarantineQueueSize} item{safetyStatus.quarantineQueueSize !== 1 ? 's' : ''} require{safetyStatus.quarantineQueueSize === 1 ? 's' : ''} safety review
            </p>
          </div>
        )}
        
        <Button 
          variant="destructive" 
          className="w-full mt-4"
          onClick={handleEmergencyStop}
          disabled={emergencyStopMutation.isPending}
          data-testid="button-emergency-stop"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          {emergencyStopMutation.isPending ? 'Stopping...' : 'Emergency Stop'}
        </Button>
      </CardContent>
    </Card>
  );
}
