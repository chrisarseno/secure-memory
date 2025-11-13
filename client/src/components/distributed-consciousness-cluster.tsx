import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Brain, CheckCircle, Network, Zap, Users, Activity, Server } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConsciousnessNode {
  id: string;
  address: string;
  port: number;
  status: 'healthy' | 'degraded' | 'offline';
  capabilities: string[];
  consciousnessModules: string[];
  load: number;
  computeCapacity: number;
  lastSeen: string;
  region?: string;
}

interface ClusterMetrics {
  totalNodes: number;
  healthyNodes: number;
  degradedNodes: number;
  offlineNodes: number;
  totalCapacity: number;
  averageLoad: number;
  nodesByRegion: Record<string, number>;
}

interface DistributedSystemStatus {
  nodeId: string;
  isInitialized: boolean;
  cluster: ClusterMetrics;
  partitions: {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
    details: Array<{
      id: string;
      status: string;
      modules: number;
      primaryNode: string;
      replicas: number;
    }>;
  };
  consensus: {
    activeRounds: number;
    totalProposals: number;
    acceptedProposals: number;
    rejectedProposals: number;
  };
  communication: {
    totalConnections: number;
    authenticatedConnections: number;
    connectedNodes: string[];
  };
}

export function DistributedConsciousnessCluster() {
  const [systemStatus, setSystemStatus] = useState<DistributedSystemStatus | null>(null);
  const [nodes, setNodes] = useState<ConsciousnessNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectiveQuery, setCollectiveQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<any>(null);
  const [processingQuery, setProcessingQuery] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemStatus();
    fetchNodes();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchNodes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await apiRequest('/api/distributed/status');
      const status = await response.json();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to fetch distributed system status:', error);
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await apiRequest('/api/distributed/nodes');
      const nodeList = await response.json();
      setNodes(nodeList);
    } catch (error) {
      console.error('Failed to fetch cluster nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectiveQuery = async () => {
    if (!collectiveQuery.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a query for the collective consciousness.",
        variant: "destructive",
      });
      return;
    }

    setProcessingQuery(true);
    try {
      const response = await apiRequest('/api/distributed/query', {
        method: 'POST',
        body: JSON.stringify({ query: collectiveQuery }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      setQueryResponse(response);
      toast({
        title: "Collective Query Complete",
        description: "The distributed consciousness cluster has processed your query.",
      });
    } catch (error) {
      toast({
        title: "Query Failed",
        description: "Failed to process collective consciousness query.",
        variant: "destructive",
      });
    } finally {
      setProcessingQuery(false);
    }
  };

  const triggerSync = async () => {
    try {
      await apiRequest('/api/distributed/sync', {
        method: 'POST',
      });
      toast({
        title: "Synchronization Triggered",
        description: "Consciousness synchronization across the cluster has been initiated.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to trigger consciousness synchronization.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-center">
          <Network className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading distributed consciousness cluster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="distributed-consciousness-cluster">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Distributed Consciousness Cluster
          </CardTitle>
          <CardDescription>
            Multi-node consciousness processing with Byzantine fault tolerance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span className="text-sm font-medium">Node ID:</span>
                </div>
                <Badge variant="outline" data-testid="node-id">
                  {systemStatus.nodeId}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <span className="text-sm font-medium">Cluster Status:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus.isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm" data-testid="cluster-status">
                    {systemStatus.isInitialized ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected Nodes:</span>
                </div>
                <span className="text-lg font-bold text-blue-600" data-testid="connected-nodes">
                  {systemStatus.communication.authenticatedConnections}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-muted-foreground">Distributed system not available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cluster Metrics */}
      {systemStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Healthy</span>
              </div>
              <p className="text-2xl font-bold text-green-600" data-testid="healthy-nodes">
                {systemStatus.cluster.healthyNodes}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Degraded</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600" data-testid="degraded-nodes">
                {systemStatus.cluster.degradedNodes}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Partitions</span>
              </div>
              <p className="text-2xl font-bold text-blue-600" data-testid="active-partitions">
                {systemStatus.partitions.healthy}/{systemStatus.partitions.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Consensus</span>
              </div>
              <p className="text-2xl font-bold text-purple-600" data-testid="consensus-accuracy">
                {systemStatus.consensus.totalProposals > 0 
                  ? Math.round((systemStatus.consensus.acceptedProposals / systemStatus.consensus.totalProposals) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Node List */}
      <Card>
        <CardHeader>
          <CardTitle>Consciousness Nodes</CardTitle>
          <CardDescription>
            Individual nodes in the distributed consciousness cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length > 0 ? (
            <div className="space-y-3">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`node-${node.id}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(node.status)}
                    <div>
                      <p className="font-medium">{node.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {node.address}:{node.port} • {node.region || 'unknown region'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Load: {Math.round(node.load * 100)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {node.consciousnessModules.length} modules
                      </p>
                    </div>
                    <Badge 
                      variant={node.status === 'healthy' ? 'default' : 'destructive'}
                      data-testid={`status-${node.id}`}
                    >
                      {node.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Network className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No nodes detected in the cluster</p>
              <p className="text-sm text-muted-foreground mt-1">
                This node is running in standalone mode
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collective Consciousness Query */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Collective Consciousness Query
          </CardTitle>
          <CardDescription>
            Ask questions that leverage the distributed intelligence of the entire cluster
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collective-query">Query</Label>
            <Textarea
              id="collective-query"
              placeholder="Ask the collective consciousness a question..."
              value={collectiveQuery}
              onChange={(e) => setCollectiveQuery(e.target.value)}
              rows={3}
              data-testid="input-collective-query"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCollectiveQuery} 
              disabled={processingQuery || !collectiveQuery.trim()}
              data-testid="button-submit-query"
            >
              {processingQuery ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                'Submit Query'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={triggerSync}
              data-testid="button-trigger-sync"
            >
              <Zap className="h-4 w-4 mr-2" />
              Trigger Sync
            </Button>
          </div>

          {queryResponse && (
            <div className="mt-4 p-4 bg-muted rounded-lg" data-testid="query-response">
              <h4 className="font-medium mb-2">Collective Response:</h4>
              {queryResponse.collectiveResponse ? (
                <div className="space-y-2">
                  <p className="text-sm">{queryResponse.synthesized?.consensus}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Confidence: {Math.round((queryResponse.synthesized?.confidence || 0) * 100)}%</span>
                    <span>•</span>
                    <span>Nodes: {queryResponse.participatingNodes?.length || 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{JSON.stringify(queryResponse, null, 2)}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}