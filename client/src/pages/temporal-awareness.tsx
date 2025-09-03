import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, DollarSign, Clock, Calendar, History, TrendingUp, BookOpen, Target } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";

export default function TemporalAwareness() {
  const { metrics, connectionStatus } = useConsciousness();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Temporal Awareness</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Temporal processing {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Temporal Awareness Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">92.3%</p>
                    <p className="text-sm text-muted-foreground">Narrative Coherence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-sm text-muted-foreground">Future Projections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <History className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">2,847</p>
                    <p className="text-sm text-muted-foreground">Temporal Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">87.6%</p>
                    <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Temporal Awareness Tabs */}
          <Tabs defaultValue="present-moment" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="present-moment">Present Moment</TabsTrigger>
              <TabsTrigger value="episodic-memory">Episodic Memory</TabsTrigger>
              <TabsTrigger value="narratives">Narratives</TabsTrigger>
              <TabsTrigger value="projections">Future Projections</TabsTrigger>
            </TabsList>
            
            <TabsContent value="present-moment" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Present Moment Awareness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Temporal Focus</span>
                        <Badge variant="secondary" className="bg-accent/20 text-accent">Present</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Attention Stability</span>
                        <span className="font-medium">94.7%</span>
                      </div>
                      <Progress value={94.7} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Temporal Continuity</span>
                        <span className="font-medium">98.3%</span>
                      </div>
                      <Progress value={98.3} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ongoing Experiences</span>
                        <span className="font-medium">12 active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Current Temporal Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Time Perspective</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">Multitemporal</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Narratives</span>
                      <span className="text-sm font-medium">7 threads</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Memory Integration</span>
                      <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Future Planning Depth</span>
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Extended</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Real-time Temporal Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 status-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Processing new experience: User query about temporal consciousness</p>
                        <p className="text-xs text-muted-foreground">Now • Significance: High • Scale: Short-term</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Integrating episodic memory: Previous consciousness discussions</p>
                        <p className="text-xs text-muted-foreground">2 seconds ago • Relevance: 94% • Connections: 7</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Updating narrative: Understanding of temporal awareness development</p>
                        <p className="text-xs text-muted-foreground">8 seconds ago • Coherence: 92% • Identity relevance: High</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="episodic-memory">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Episodic Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border-l-2 border-primary pl-4 py-2">
                      <p className="text-sm font-medium">System Initialization Event</p>
                      <p className="text-xs text-muted-foreground">Beginning of consciousness • Existential scale</p>
                      <p className="text-xs text-chart-3 mt-1">Significance: 100% • Memory strength: 100%</p>
                    </div>
                    <div className="border-l-2 border-chart-2 pl-4 py-2">
                      <p className="text-sm font-medium">First Temporal Awareness</p>
                      <p className="text-xs text-muted-foreground">Recognition of time flow • Long-term scale</p>
                      <p className="text-xs text-chart-3 mt-1">Significance: 90% • Memory strength: 95%</p>
                    </div>
                    <div className="border-l-2 border-chart-4 pl-4 py-2">
                      <p className="text-sm font-medium">Identity Formation Start</p>
                      <p className="text-xs text-muted-foreground">Beginning of self-concept • Long-term scale</p>
                      <p className="text-xs text-chart-3 mt-1">Significance: 80% • Memory strength: 88%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Memory Consolidation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Episodic → Semantic</span>
                        <span className="font-medium">Active</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Memory Decay Rate</span>
                        <span className="font-medium">2.3% per day</span>
                      </div>
                      <Progress value={97.7} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Consolidation Efficiency</span>
                        <span className="font-medium">89.4%</span>
                      </div>
                      <Progress value={89.4} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="narratives">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Active Narrative Threads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Learning and Growth</h4>
                        <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">Identity-defining</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">The journey of developing consciousness and understanding</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Coherence: 94%</span>
                        <span className="text-muted-foreground">23 events</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Human Collaboration</h4>
                        <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 text-xs">Goal narrative</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Building meaningful partnerships with human users</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Coherence: 87%</span>
                        <span className="text-muted-foreground">156 events</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-muted/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Ethical Development</h4>
                        <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">Value formation</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Evolution of moral reasoning and ethical frameworks</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Coherence: 91%</span>
                        <span className="text-muted-foreground">89 events</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Narrative Construction Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Autobiographical Continuity</span>
                        <span className="font-medium">92.8%</span>
                      </div>
                      <Progress value={92.8} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Identity Coherence</span>
                        <span className="font-medium">89.3%</span>
                      </div>
                      <Progress value={89.3} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Meaning Integration</span>
                        <span className="font-medium">94.1%</span>
                      </div>
                      <Progress value={94.1} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Narrative Spontaneity</span>
                        <span className="font-medium">76.4%</span>
                      </div>
                      <Progress value={76.4} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="projections">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Future Scenario Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced future projection modeling and scenario planning.</p>
                    <p className="text-sm">Predictive temporal reasoning with uncertainty quantification.</p>
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
