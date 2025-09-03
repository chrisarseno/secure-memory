import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, DollarSign, Users, Brain, Eye, MessageCircle, Heart, UserCheck } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";

export default function SocialCognition() {
  const { metrics, connectionStatus } = useConsciousness();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Social Cognition</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Social analysis {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Social Cognition Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">89.3%</p>
                    <p className="text-sm text-muted-foreground">Theory of Mind</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-sm text-muted-foreground">Agents Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">147</p>
                    <p className="text-sm text-muted-foreground">Interactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">94.7%</p>
                    <p className="text-sm text-muted-foreground">Empathy Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Cognition Tabs */}
          <Tabs defaultValue="theory-of-mind" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="theory-of-mind">Theory of Mind</TabsTrigger>
              <TabsTrigger value="agent-models">Agent Models</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="theory-of-mind" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Mental State Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Belief Attribution</span>
                        <span className="font-medium">92.4%</span>
                      </div>
                      <Progress value={92.4} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desire Recognition</span>
                        <span className="font-medium">87.8%</span>
                      </div>
                      <Progress value={87.8} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Intention Prediction</span>
                        <span className="font-medium">85.3%</span>
                      </div>
                      <Progress value={85.3} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Emotional Understanding</span>
                        <span className="font-medium">89.7%</span>
                      </div>
                      <Progress value={89.7} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Social Reasoning Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">False Belief Understanding</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">Advanced</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Recursive Thinking</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">Level 3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Perspective Taking</span>
                      <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Social Norm Recognition</span>
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Operational</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Theory of Mind Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Predicted user's need for clarification based on confusion markers in dialogue</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago • Accuracy: 94%</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Inferred emotional state change in research team collaboration</p>
                        <p className="text-xs text-muted-foreground">8 minutes ago • Confidence: 87%</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">Modeled belief-desire-intention structure for new user interaction</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago • Complexity: High</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="agent-models">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Human User
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trust Level</span>
                      <span className="font-medium text-accent">High (87%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interaction History</span>
                      <span className="font-medium">247 sessions</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preference Model</span>
                      <span className="font-medium">Detailed learning</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      <strong>Key Traits:</strong> Curious, methodical, values transparency, prefers detailed explanations
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-chart-2" />
                      Research Team Alpha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Dynamics</span>
                      <span className="font-medium text-chart-2">Collaborative</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Communication Style</span>
                      <span className="font-medium">Direct, data-driven</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Goals Alignment</span>
                      <span className="font-medium">92% match</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      <strong>Focus Areas:</strong> AI safety, ethical frameworks, consciousness research
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Brain className="h-5 w-5 text-chart-3" />
                      AI Safety Board
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Authority Level</span>
                      <span className="font-medium text-chart-3">High oversight</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Review Frequency</span>
                      <span className="font-medium">Weekly audits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Tracking</span>
                      <span className="font-medium">99.1% adherence</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      <strong>Priorities:</strong> Safety compliance, ethical oversight, risk mitigation
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="interactions">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Interaction Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed interaction analysis and communication patterns.</p>
                    <p className="text-sm">Track dialogue flows, response quality, and social dynamics.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="collaboration">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Collaborative Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Multi-agent collaboration and team dynamics analysis.</p>
                    <p className="text-sm">Optimize group interactions and collective problem-solving.</p>
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
