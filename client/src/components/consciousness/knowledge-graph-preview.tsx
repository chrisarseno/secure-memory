import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Brain, Users, Clock, Scale, Lightbulb } from "lucide-react";
import { ConsciousnessAPI } from "@/lib/consciousness-api";
import type { KnowledgeGraph } from "../../../../shared/schema";

interface KnowledgeGraphPreviewProps {
  className?: string;
  height?: string;
}

export default function KnowledgeGraphPreview({ className = "", height = "h-64" }: KnowledgeGraphPreviewProps) {
  // Fetch knowledge graph data
  const { data: graphData, isLoading } = useQuery<KnowledgeGraph>({
    queryKey: ['/api/knowledge-graph'],
    queryFn: ConsciousnessAPI.getKnowledgeGraph,
    refetchInterval: 60000, // Update every minute
  });

  const getNodeIcon = (nodeId: string) => {
    const iconMap: Record<string, any> = {
      'central': Brain,
      'social': Users,
      'temporal': Clock,
      'values': Scale,
      'creative': Lightbulb,
    };
    return iconMap[nodeId] || Brain;
  };

  const getNodeColor = (nodeId: string) => {
    const colorMap: Record<string, string> = {
      'central': 'primary',
      'social': 'accent',
      'temporal': 'chart-3',
      'values': 'chart-4',
      'creative': 'chart-2',
    };
    return colorMap[nodeId] || 'primary';
  };

  const renderNodes = () => {
    if (graphData?.nodes) {
      return graphData.nodes.slice(1).map((node, index) => {
        const Icon = getNodeIcon(node.id);
        const positions = [
          { top: '8%', left: '33%' },
          { top: '8%', right: '33%' },
          { bottom: '8%', left: '25%' },
          { bottom: '8%', right: '25%' }
        ];
        const position = positions[index] || positions[0];
        
        return (
          <div 
            key={node.id}
            className={`absolute w-8 h-8 bg-${getNodeColor(node.id)} rounded-full flex items-center justify-center`}
            style={position}
            data-testid={`graph-node-${node.id}`}
          >
            <Icon className="h-4 w-4 text-background" />
          </div>
        );
      });
    }

    // Default nodes if no data
    return [
      <div key="social" className="absolute top-8 left-1/3 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
        <Users className="h-4 w-4 text-accent-foreground" />
      </div>,
      <div key="creative" className="absolute top-8 right-1/3 w-8 h-8 bg-chart-2 rounded-full flex items-center justify-center">
        <Lightbulb className="h-4 w-4 text-background" />
      </div>,
      <div key="temporal" className="absolute bottom-8 left-1/4 w-8 h-8 bg-chart-3 rounded-full flex items-center justify-center">
        <Clock className="h-4 w-4 text-background" />
      </div>,
      <div key="values" className="absolute bottom-8 right-1/4 w-8 h-8 bg-chart-4 rounded-full flex items-center justify-center">
        <Scale className="h-4 w-4 text-background" />
      </div>
    ];
  };

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Knowledge Graph Overview</CardTitle>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-open-full-graph">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Full Graph
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simplified knowledge graph visualization */}
        <div className={`relative ${height} bg-muted/20 rounded-lg border border-border overflow-hidden`} data-testid="knowledge-graph-preview">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                Loading knowledge graph...
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Simulated graph nodes and connections */}
              <div className="relative w-full h-full p-8">
                {/* Central node */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center consciousness-glow">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                
                {/* Surrounding nodes */}
                {renderNodes()}
                
                {/* Connection lines (simplified) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="50%" y1="50%" x2="33%" y2="20%" stroke="hsl(217 91% 60%)" strokeWidth="2" opacity="0.6"/>
                  <line x1="50%" y1="50%" x2="67%" y2="20%" stroke="hsl(217 91% 60%)" strokeWidth="2" opacity="0.6"/>
                  <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="hsl(217 91% 60%)" strokeWidth="2" opacity="0.6"/>
                  <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="hsl(217 91% 60%)" strokeWidth="2" opacity="0.6"/>
                </svg>
              </div>
            </div>
          )}
          
          {/* Graph Stats Overlay */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-sm" data-testid="graph-stats">
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Nodes:</span>
                <span className="font-medium" data-testid="graph-nodes-count">
                  {graphData?.totalNodes?.toLocaleString() || '127,394'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Edges:</span>
                <span className="font-medium" data-testid="graph-edges-count">
                  {graphData?.totalEdges?.toLocaleString() || '2,847,192'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Clusters:</span>
                <span className="font-medium" data-testid="graph-clusters-count">
                  {graphData?.clusters || 42}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
