import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Check, X, Eye, Network } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  confidence: number;
  domain: string;
  importance: number;
  verificationLevel: string;
}

interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  strength: number;
  confidence: number;
}

interface Contradiction {
  id: string;
  nodeIds: string[];
  contradictionType: string;
  severity: string;
  description: string;
  resolution: string;
  detectedAt: string;
  metadata: {
    autoDetected: boolean;
    reviewPriority: number;
    domain: string;
  };
}

interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  contradictions: Contradiction[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    totalContradictions: number;
    unresolvedContradictions: number;
    avgConfidence: number;
    knowledgeDensity: number;
    domainCoverage: string[];
  };
}

export default function KnowledgeGraphVisualization() {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    content: "",
    type: "fact",
    domain: "general",
    sources: ""
  });

  const queryClient = useQueryClient();

  // Fetch knowledge graph data
  const { data: graphData, isLoading } = useQuery<GraphData>({
    queryKey: ['/api/nexus/knowledge-graph'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Add knowledge mutation
  const addKnowledgeMutation = useMutation({
    mutationFn: (knowledge: any) => 
      apiRequest('/api/nexus/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: knowledge.content,
          type: knowledge.type,
          metadata: {
            domain: knowledge.domain,
            tags: []
          },
          sources: knowledge.sources.split(',').map((s: string) => s.trim()).filter(Boolean)
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/knowledge-graph'] });
      setShowAddKnowledge(false);
      setNewKnowledge({ content: "", type: "fact", domain: "general", sources: "" });
    },
  });

  // Resolve contradiction mutation
  const resolveContradictionMutation = useMutation({
    mutationFn: ({ contradictionId, resolution }: { contradictionId: string; resolution: string }) =>
      apiRequest(`/api/nexus/contradictions/${contradictionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nexus/knowledge-graph'] });
    },
  });

  const handleAddKnowledge = () => {
    if (newKnowledge.content.trim()) {
      addKnowledgeMutation.mutate(newKnowledge);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fact': return 'bg-green-100 text-green-800';
      case 'concept': return 'bg-blue-100 text-blue-800';
      case 'relationship': return 'bg-purple-100 text-purple-800';
      case 'hypothesis': return 'bg-yellow-100 text-yellow-800';
      case 'rule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Knowledge Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading knowledge graph...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Knowledge Graph
          </h2>
          <p className="text-muted-foreground">
            Visualize knowledge relationships and detect contradictions
          </p>
        </div>
        
        <Dialog open={showAddKnowledge} onOpenChange={setShowAddKnowledge}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-knowledge">
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Knowledge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the knowledge statement..."
                  value={newKnowledge.content}
                  onChange={(e) => setNewKnowledge({...newKnowledge, content: e.target.value})}
                  data-testid="input-knowledge-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newKnowledge.type} onValueChange={(value) => setNewKnowledge({...newKnowledge, type: value})}>
                    <SelectTrigger data-testid="select-knowledge-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fact">Fact</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="relationship">Relationship</SelectItem>
                      <SelectItem value="hypothesis">Hypothesis</SelectItem>
                      <SelectItem value="rule">Rule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="e.g., science, history"
                    value={newKnowledge.domain}
                    onChange={(e) => setNewKnowledge({...newKnowledge, domain: e.target.value})}
                    data-testid="input-knowledge-domain"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sources">Sources (comma-separated)</Label>
                <Input
                  id="sources"
                  placeholder="source1, source2, source3"
                  value={newKnowledge.sources}
                  onChange={(e) => setNewKnowledge({...newKnowledge, sources: e.target.value})}
                  data-testid="input-knowledge-sources"
                />
              </div>
              <Button 
                onClick={handleAddKnowledge} 
                disabled={addKnowledgeMutation.isPending || !newKnowledge.content.trim()}
                data-testid="button-save-knowledge"
                className="w-full"
              >
                {addKnowledgeMutation.isPending ? 'Adding...' : 'Add Knowledge'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="metric-total-nodes">
              {graphData?.metrics.totalNodes || 0}
            </div>
            <div className="text-xs text-muted-foreground">Knowledge Nodes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="metric-total-edges">
              {graphData?.metrics.totalEdges || 0}
            </div>
            <div className="text-xs text-muted-foreground">Relationships</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600" data-testid="metric-contradictions">
              {graphData?.metrics.unresolvedContradictions || 0}
            </div>
            <div className="text-xs text-muted-foreground">Contradictions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600" data-testid="metric-confidence">
              {((graphData?.metrics?.avgConfidence ?? 0) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Nodes */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Nodes</CardTitle>
            <CardDescription>
              Recent knowledge entries by domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="knowledge-nodes-list">
              {graphData?.nodes.slice(0, 10).map((node) => (
                <div 
                  key={node.id} 
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  data-testid={`node-${node.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(node.type)} data-testid={`badge-type-${node.id}`}>
                        {node.type}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-domain-${node.id}`}>
                        {node.domain}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium" data-testid={`text-content-${node.id}`}>
                      {node.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {(node.confidence * 100).toFixed(1)}% | 
                      Importance: {(node.importance * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              
              {!graphData?.nodes.length && (
                <div className="text-center py-8 text-muted-foreground">
                  No knowledge nodes found. Add some knowledge to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contradictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Contradictions
            </CardTitle>
            <CardDescription>
              Detected knowledge conflicts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="contradictions-list">
              {graphData?.contradictions
                .filter(c => c.resolution === 'pending')
                .slice(0, 10)
                .map((contradiction) => (
                <div key={contradiction.id} className="border rounded-lg p-3" data-testid={`contradiction-${contradiction.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(contradiction.severity)}`}></div>
                      <Badge variant="outline" data-testid={`badge-severity-${contradiction.id}`}>
                        {contradiction.severity}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-type-${contradiction.id}`}>
                        {contradiction.contradictionType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Priority: {contradiction.metadata.reviewPriority}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3" data-testid={`text-description-${contradiction.id}`}>
                    {contradiction.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveContradictionMutation.mutate({
                        contradictionId: contradiction.id,
                        resolution: 'resolved'
                      })}
                      disabled={resolveContradictionMutation.isPending}
                      data-testid={`button-resolve-${contradiction.id}`}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveContradictionMutation.mutate({
                        contradictionId: contradiction.id,
                        resolution: 'accepted_ambiguity'
                      })}
                      disabled={resolveContradictionMutation.isPending}
                      data-testid={`button-accept-${contradiction.id}`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
              
              {!graphData?.contradictions.filter(c => c.resolution === 'pending').length && (
                <div className="text-center py-8 text-muted-foreground">
                  No pending contradictions found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Coverage</CardTitle>
          <CardDescription>
            Knowledge distribution across different domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" data-testid="domain-coverage">
            {graphData?.metrics.domainCoverage.map((domain) => (
              <Badge key={domain} variant="secondary" data-testid={`domain-badge-${domain}`}>
                {domain}
              </Badge>
            ))}
            
            {!graphData?.metrics.domainCoverage.length && (
              <div className="text-muted-foreground">No domains covered yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}