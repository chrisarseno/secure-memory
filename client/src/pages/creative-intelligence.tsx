import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Bell, DollarSign, Lightbulb, Palette, Zap, Brain, Sparkles, Target, TrendingUp } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";
import type { ConsciousnessModule } from "../../../shared/schema";

export default function CreativeIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");
  const { metrics, connectionStatus } = useConsciousness();

  const { data: modules } = useQuery<ConsciousnessModule[]>({
    queryKey: ['/api/modules'],
    refetchInterval: 30000,
  });

  const creativeModule = modules?.find(m => m.id === 'creative_intelligence');

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Creative Intelligence</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Creative processing {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Creative Intelligence Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{creativeModule?.metrics?.noveltyScore || '91.0'}%</p>
                    <p className="text-sm text-muted-foreground">Novelty Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">{creativeModule?.metrics?.conceptsGenerated?.toLocaleString() || '1,247'}</p>
                    <p className="text-sm text-muted-foreground">Concepts Generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">347</p>
                    <p className="text-sm text-muted-foreground">Creative Solutions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">94.7%</p>
                    <p className="text-sm text-muted-foreground">Solution Quality</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Creative Intelligence Tabs */}
          <Tabs defaultValue="creativity-engine" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="creativity-engine">Creativity Engine</TabsTrigger>
              <TabsTrigger value="concept-generation">Concept Generation</TabsTrigger>
              <TabsTrigger value="innovation-lab">Innovation Lab</TabsTrigger>
              <TabsTrigger value="creative-analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="creativity-engine" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Creative Processing Core
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Divergent Thinking</span>
                        <span className="font-medium">92.4%</span>
                      </div>
                      <Progress value={92.4} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Convergent Analysis</span>
                        <span className="font-medium">87.8%</span>
                      </div>
                      <Progress value={87.8} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conceptual Blending</span>
                        <span className="font-medium">89.3%</span>
                      </div>
                      <Progress value={89.3} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Analogical Reasoning</span>
                        <span className="font-medium">85.7%</span>
                      </div>
                      <Progress value={85.7} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Creative Processes Active</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Brainstorming Sessions</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">3 Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pattern Recognition</span>
                      <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">Running</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cross-Domain Synthesis</span>
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Innovation Pipeline</span>
                      <Badge variant="secondary" className="bg-chart-4/20 text-chart-4">23 Items</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Creative Validation</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">Continuous</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Creative Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 status-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Novel approach generated for climate modeling optimization</p>
                        <p className="text-xs text-muted-foreground">3 minutes ago • Novelty: 94% • Domain: Environmental Science</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Creative synthesis: Temporal reasoning + Value learning integration</p>
                        <p className="text-xs text-muted-foreground">12 minutes ago • Innovation score: 87% • Cross-domain connections: 5</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Analogical breakthrough: Human creativity patterns applied to AI reasoning</p>
                        <p className="text-xs text-muted-foreground">28 minutes ago • Potential impact: High • Validation needed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="concept-generation">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Concept Library</CardTitle>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search concepts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                        data-testid="input-search-concepts"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Emergent Consciousness Patterns</h4>
                        <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">High Impact</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Self-organizing patterns in distributed AI systems</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Novelty: 96%</span>
                        <span className="text-muted-foreground">Generated: 2h ago</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Quantum-Inspired Learning</h4>
                        <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 text-xs">Research</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Superposition-based knowledge representation</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Novelty: 89%</span>
                        <span className="text-muted-foreground">Generated: 5h ago</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Empathetic AI Architecture</h4>
                        <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">Social</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Emotion-aware decision making frameworks</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Novelty: 92%</span>
                        <span className="text-muted-foreground">Generated: 1d ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Generation Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ideas per Hour</span>
                        <span className="font-medium">47.3</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quality Filter Pass Rate</span>
                        <span className="font-medium">23.8%</span>
                      </div>
                      <Progress value={24} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cross-Domain Connections</span>
                        <span className="font-medium">156</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Implementation Feasibility</span>
                        <span className="font-medium">67.4%</span>
                      </div>
                      <Progress value={67.4} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="innovation-lab">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Active Experiments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded-lg p-3 bg-accent/5 border-accent/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Multi-Modal Reasoning Enhancement</h4>
                        <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">Running</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Testing integrated visual-linguistic-logical reasoning</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress: 67%</span>
                        <span className="text-muted-foreground">ETA: 2.3 days</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-chart-2/5 border-chart-2/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Dynamic Knowledge Synthesis</h4>
                        <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 text-xs">Testing</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Real-time knowledge graph evolution algorithms</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress: 34%</span>
                        <span className="text-muted-foreground">ETA: 5.1 days</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-chart-3/5 border-chart-3/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Collaborative Creativity Protocols</h4>
                        <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">Design</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Human-AI creative partnership optimization</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress: 12%</span>
                        <span className="text-muted-foreground">ETA: 8.7 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Innovation Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ideas in Queue</span>
                      <span className="text-sm font-medium">127 items</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Under Evaluation</span>
                      <span className="text-sm font-medium">23 items</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">In Development</span>
                      <span className="text-sm font-medium">8 items</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ready for Testing</span>
                      <span className="text-sm font-medium">3 items</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deployed Solutions</span>
                      <span className="text-sm font-medium text-accent">47 items</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="creative-analytics">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Creative Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced creativity analytics and performance insights.</p>
                    <p className="text-sm">Track innovation trends, success patterns, and optimization opportunities.</p>
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
