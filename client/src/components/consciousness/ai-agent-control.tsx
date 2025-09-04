import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Users, 
  ArrowRightLeft, 
  Lightbulb,
  Shield,
  Palette,
  BookOpen,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initializeSocket } from "@/lib/socket";

interface AgentProfile {
  id: string;
  name: string;
  specialization: string;
  capabilities: string[];
  currentTask?: string;
  status: 'idle' | 'busy' | 'learning' | 'collaborating';
  lastActive: number;
}

interface CollaborationRequest {
  id: string;
  from: string;
  to: string;
  type: 'query' | 'task_delegation' | 'knowledge_share' | 'problem_solving';
  content: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

interface AIAgentControlProps {
  className?: string;
}

export default function AIAgentControl({ className = "" }: AIAgentControlProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [collaborationType, setCollaborationType] = useState<string>("query");
  const [collaborationContent, setCollaborationContent] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch agent status
  const { data: agents = [], isLoading: agentsLoading } = useQuery<AgentProfile[]>({
    queryKey: ['/api/collaboration/agents'],
    refetchInterval: 5000,
  });

  // Fetch active collaborations
  const { data: collaborations = [], isLoading: collaborationsLoading } = useQuery<CollaborationRequest[]>({
    queryKey: ['/api/collaboration/active'],
    refetchInterval: 3000,
  });

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    const socket = initializeSocket();

    socket.on('agent-status', (data) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        id: `status_${Date.now()}`,
        type: 'status',
        message: 'Agent status updated',
        timestamp: Date.now()
      }]);
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/agents'] });
    });

    socket.on('collaboration-response', (data) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        id: data.requestId,
        type: 'response',
        message: `${data.from} completed collaboration task`,
        confidence: data.confidence,
        processingTime: data.processingTime,
        timestamp: data.timestamp
      }]);
      
      toast({
        title: "Collaboration Complete",
        description: `${data.from} has completed the collaboration task`,
      });
    });

    socket.on('task-completed', (data) => {
      setRealtimeUpdates(prev => [...prev.slice(-9), {
        id: data.requestId,
        type: 'task_complete',
        message: `Task completed by ${data.agentId}`,
        timestamp: data.completedAt
      }]);
      
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/active'] });
    });

    return () => {
      socket.off('agent-status');
      socket.off('collaboration-response');
      socket.off('task-completed');
    };
  }, [queryClient, toast]);

  // Initiate collaboration mutation
  const collaborationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/collaboration/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to initiate collaboration');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Collaboration Initiated",
        description: `AI collaboration started (ID: ${data.collaborationId})`,
      });
      setCollaborationContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/active'] });
    },
    onError: (error) => {
      toast({
        title: "Collaboration Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Problem solving mutation
  const problemSolvingMutation = useMutation({
    mutationFn: async (problem: any) => {
      const response = await fetch('/api/collaboration/problem-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem })
      });
      if (!response.ok) throw new Error('Failed to start problem solving');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Problem Solving Started",
        description: `Distributed AI problem solving initiated (ID: ${data.coordinationId})`,
      });
      setProblemDescription("");
    },
    onError: (error) => {
      toast({
        title: "Problem Solving Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const getAgentIcon = (specialization: string) => {
    switch (specialization) {
      case 'General Problem Solving':
        return <Brain className="h-5 w-5 text-primary" />;
      case 'Autonomous Learning':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'Content Analysis':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'Safety Oversight':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'Creative Problem Solving':
        return <Palette className="h-5 w-5 text-orange-500" />;
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'default';
      case 'busy': return 'secondary';
      case 'learning': return 'outline';
      case 'collaborating': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleInitiateCollaboration = () => {
    if (!selectedAgent || !collaborationContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an agent and provide collaboration content",
        variant: "destructive",
      });
      return;
    }

    collaborationMutation.mutate({
      from: 'human-operator',
      to: selectedAgent,
      type: collaborationType,
      content: {
        query: collaborationContent,
        context: "Human-initiated collaboration request"
      },
      priority: 'high'
    });
  };

  const handleDistributedProblemSolving = () => {
    if (!problemDescription.trim()) {
      toast({
        title: "Missing Problem Description",
        description: "Please provide a problem description",
        variant: "destructive",
      });
      return;
    }

    problemSolvingMutation.mutate({
      title: "Human-Submitted Problem",
      description: problemDescription,
      type: "complex",
      complexity: 8,
      domain: "general",
      constraints: ["time-sensitive", "multi-domain"],
      expectedOutcome: "Comprehensive solution with implementation steps"
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          AI Agent Collaboration Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Agent Status Grid */}
        <div>
          <h3 className="text-sm font-medium mb-3">Active AI Agents</h3>
          {agentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="p-3 border rounded-lg bg-muted/20"
                  data-testid={`agent-card-${agent.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAgentIcon(agent.specialization)}
                      <span className="font-medium text-sm">{agent.name}</span>
                    </div>
                    <Badge variant={getStatusColor(agent.status)} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {agent.specialization}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 2).map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  {agent.currentTask && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Task: {agent.currentTask}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Active: {formatTimeAgo(agent.lastActive)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Collaboration Controls */}
        <div>
          <h3 className="text-sm font-medium mb-3">Initiate AI Collaboration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-2 block">Target Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger data-testid="select-target-agent">
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.status === 'idle').map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block">Collaboration Type</label>
                <Select value={collaborationType} onValueChange={setCollaborationType}>
                  <SelectTrigger data-testid="select-collaboration-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="query">Query / Question</SelectItem>
                    <SelectItem value="task_delegation">Task Delegation</SelectItem>
                    <SelectItem value="knowledge_share">Knowledge Share</SelectItem>
                    <SelectItem value="problem_solving">Problem Solving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block">Collaboration Content</label>
              <Textarea
                placeholder="Describe what you need the AI agent to do..."
                value={collaborationContent}
                onChange={(e) => setCollaborationContent(e.target.value)}
                className="min-h-20"
                data-testid="textarea-collaboration-content"
              />
            </div>
            <Button
              onClick={handleInitiateCollaboration}
              disabled={collaborationMutation.isPending || !selectedAgent || !collaborationContent.trim()}
              className="w-full"
              data-testid="button-initiate-collaboration"
            >
              {collaborationMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Initiate Collaboration
            </Button>
          </div>
        </div>

        <Separator />

        {/* Distributed Problem Solving */}
        <div>
          <h3 className="text-sm font-medium mb-3">Distributed Problem Solving</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-2 block">Problem Description</label>
              <Textarea
                placeholder="Describe a complex problem that requires multiple AI agents to collaborate..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="min-h-24"
                data-testid="textarea-problem-description"
              />
            </div>
            <Button
              onClick={handleDistributedProblemSolving}
              disabled={problemSolvingMutation.isPending || !problemDescription.trim()}
              className="w-full"
              variant="secondary"
              data-testid="button-distributed-problem-solve"
            >
              {problemSolvingMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              Start Distributed Problem Solving
            </Button>
          </div>
        </div>

        {/* Active Collaborations */}
        {collaborations.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Active Collaborations</h3>
              <ScrollArea className="h-32">
                <div className="space-y-2" data-testid="active-collaborations">
                  {collaborations.map((collab) => (
                    <div 
                      key={collab.id} 
                      className="p-2 border rounded bg-muted/10 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {collab.from} → {collab.to}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {collab.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {typeof collab.content === 'string' 
                          ? collab.content.substring(0, 60) + (collab.content.length > 60 ? '...' : '')
                          : collab.content.query?.substring(0, 60) || 'Complex collaboration'
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(collab.timestamp)}</span>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {collab.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Real-time Updates */}
        {realtimeUpdates.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Real-time Collaboration Updates</h3>
              <ScrollArea className="h-24">
                <div className="space-y-1" data-testid="realtime-updates">
                  {realtimeUpdates.slice(-5).map((update) => (
                    <div 
                      key={update.id} 
                      className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/10 rounded"
                    >
                      {update.type === 'response' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {update.type === 'status' && <AlertCircle className="h-3 w-3 text-blue-500" />}
                      {update.type === 'task_complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      <span>{update.message}</span>
                      {update.confidence && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {Math.round(update.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}