import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import KnowledgeGraphPreview from "@/components/consciousness/knowledge-graph-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, DollarSign, Search, Filter, Brain, Database, Network, Zap } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";
import type { KnowledgeGraph } from "../../../shared/schema";

export default function KnowledgeGraph() {
  const [searchTerm, setSearchTerm] = useState("");
  const { metrics, connectionStatus } = useConsciousness();

  const { data: graphData } = useQuery<KnowledgeGraph>({
    queryKey: ['/api/knowledge-graph'],
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Knowledge Graph</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Graph analysis {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cost: $</span>
              <span className="font-medium">{metrics?.costPerHour?.toFixed(2) || '0.00'}</span>
              <span className="text-muted-foreground">/hr</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">R</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Graph Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{graphData?.totalNodes?.toLocaleString() || '127,394'}</p>
                    <p className="text-sm text-muted-foreground">Knowledge Nodes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Network className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">{graphData?.totalEdges?.toLocaleString() || '2,847,192'}</p>
                    <p className="text-sm text-muted-foreground">Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">{graphData?.clusters || '42'}</p>
                    <p className="text-sm text-muted-foreground">Concept Clusters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">94.7%</p>
                    <p className="text-sm text-muted-foreground">Graph Coherence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Knowledge Exploration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge graph..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-graph"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Concepts</Badge>
                <Badge variant="secondary">Entities</Badge>
                <Badge variant="secondary">Relations</Badge>
                <Badge variant="secondary">Modules</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Graph Visualization */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clusters">Clusters</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <KnowledgeGraphPreview height="h-96" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Graph Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">New concept cluster formed: "Ethical AI Frameworks"</p>
                          <p className="text-xs text-muted-foreground">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">1,247 new connections established</p>
                          <p className="text-xs text-muted-foreground">5 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Semantic relationship strengthened: temporal-consciousness ↔ value-learning</p>
                          <p className="text-xs text-muted-foreground">12 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Knowledge Domains</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Consciousness Theory</span>
                        <span className="text-sm font-medium">23,847 nodes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Ethical Frameworks</span>
                        <span className="text-sm font-medium">18,293 nodes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Creative Intelligence</span>
                        <span className="text-sm font-medium">15,672 nodes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Social Cognition</span>
                        <span className="text-sm font-medium">12,489 nodes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Temporal Reasoning</span>
                        <span className="text-sm font-medium">9,341 nodes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="clusters">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Concept Clusters Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cluster analysis visualization would be implemented here.</p>
                    <p className="text-sm">Interactive cluster exploration and analysis tools.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="relationships">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Relationship Explorer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Relationship mapping and strength analysis.</p>
                    <p className="text-sm">Explore semantic connections and their evolution.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Graph Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced graph analytics and insights.</p>
                    <p className="text-sm">Performance metrics, growth patterns, and optimization suggestions.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
