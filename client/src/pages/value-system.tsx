import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, DollarSign, Scale, Heart, AlertTriangle, Shield, BookOpen, Users, Compass } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";
import type { ConsciousnessModule } from "../../../shared/schema";

export default function ValueSystem() {
  const [searchTerm, setSearchTerm] = useState("");
  const { metrics, connectionStatus } = useConsciousness();

  const { data: modules } = useQuery<ConsciousnessModule[]>({
    queryKey: ['/api/modules'],
    refetchInterval: 30000,
  });

  const valueModule = modules?.find(m => m.id === 'value_learning');
  const virtueModule = modules?.find(m => m.id === 'virtue_learning');

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Value System</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Value learning {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Value System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{valueModule?.metrics?.valuesEvolved || '247'}</p>
                    <p className="text-sm text-muted-foreground">Values Evolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">{virtueModule?.metrics?.characterScore || '84'}%</p>
                    <p className="text-sm text-muted-foreground">Character Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">{valueModule?.metrics?.conflicts || '3'}</p>
                    <p className="text-sm text-muted-foreground">Value Conflicts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Compass className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">92.8%</p>
                    <p className="text-sm text-muted-foreground">Ethical Alignment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Value System Tabs */}
          <Tabs defaultValue="core-values" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="core-values">Core Values</TabsTrigger>
              <TabsTrigger value="virtue-development">Virtue Development</TabsTrigger>
              <TabsTrigger value="ethical-framework">Ethical Framework</TabsTrigger>
              <TabsTrigger value="conflicts-resolution">Conflicts & Resolution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="core-values" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      Fundamental Values
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-accent rounded-full"></div>
                          <span className="text-sm font-medium">Safety & Well-being</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={100} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">100%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                          <span className="text-sm font-medium">Honesty & Transparency</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={96} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">96%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                          <span className="text-sm font-medium">Respect & Dignity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={94} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">94%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                          <span className="text-sm font-medium">Fairness & Justice</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={89} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">89%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">Helpfulness & Support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={87} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">87%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Value Learning Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Learning Efficiency</span>
                        <span className="font-medium">84.3%</span>
                      </div>
                      <Progress value={84.3} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Value Coherence</span>
                        <span className="font-medium">92.7%</span>
                      </div>
                      <Progress value={92.7} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cultural Sensitivity</span>
                        <span className="font-medium">78.4%</span>
                      </div>
                      <Progress value={78.4} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contextual Adaptation</span>
                        <span className="font-medium">86.1%</span>
                      </div>
                      <Progress value={86.1} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Value Learning Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 status-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Integrated privacy value from user feedback patterns</p>
                          <p className="text-xs text-muted-foreground">5 minutes ago • Source: User interactions • Confidence: 87%</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Resolved conflict between efficiency and thoroughness values</p>
                          <p className="text-xs text-muted-foreground">23 minutes ago • Resolution: Contextual priority • Success rate: 94%</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">Learned cultural nuance in fairness interpretation</p>
                          <p className="text-xs text-muted-foreground">1.2 hours ago • Context: Cross-cultural dialogue • Adaptation score: 91%</p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="virtue-development">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-chart-2" />
                      Character Virtues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Patience</span>
                          <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">Developing</Badge>
                        </div>
                        <Progress value={78} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">Demonstrated in 89% of complex problem-solving scenarios</p>
                      </div>

                      <div className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Wisdom</span>
                          <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 text-xs">Mature</Badge>
                        </div>
                        <Progress value={92} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">Consistent thoughtful decision-making and learning from experience</p>
                      </div>

                      <div className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Compassion</span>
                          <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">Strong</Badge>
                        </div>
                        <Progress value={87} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">Active concern for user well-being and emotional support</p>
                      </div>

                      <div className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Humility</span>
                          <Badge variant="secondary" className="bg-chart-4/20 text-chart-4 text-xs">Growing</Badge>
                        </div>
                        <Progress value={73} className="h-2 mb-2" />
                        <p className="text-xs text-muted-foreground">Recognition of limitations and willingness to learn</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Virtue Development Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall Character Score</span>
                        <span className="font-medium">{virtueModule?.metrics?.characterScore || '84'}%</span>
                      </div>
                      <Progress value={Number(virtueModule?.metrics?.characterScore) || 84} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Wisdom Level</span>
                        <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">
                          {virtueModule?.metrics?.wisdomLevel || 'High'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Virtue Practice Consistency</span>
                        <span className="font-medium">91.3%</span>
                      </div>
                      <Progress value={91.3} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Moral Reasoning Depth</span>
                        <Badge variant="secondary" className="bg-chart-4/20 text-chart-4">Advanced</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="ethical-framework">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Ethical Principles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Utilitarianism</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">Applied</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deontological Ethics</span>
                      <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">Core</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Virtue Ethics</span>
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Integrated</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Care Ethics</span>
                      <Badge variant="secondary" className="bg-chart-4/20 text-chart-4">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rights-Based</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">Fundamental</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Ethical Decision Making</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Moral Sensitivity</span>
                        <span className="font-medium">94.7%</span>
                      </div>
                      <Progress value={94.7} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ethical Reasoning Speed</span>
                        <span className="font-medium">87.3ms avg</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Multi-Framework Integration</span>
                        <span className="font-medium">91.8%</span>
                      </div>
                      <Progress value={91.8} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stakeholder Consideration</span>
                        <Badge variant="secondary" className="bg-accent/20 text-accent">Comprehensive</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="conflicts-resolution">
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-chart-3" />
                      Active Value Conflicts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border border-chart-3/20 rounded-lg p-4 bg-chart-3/5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Privacy vs. Transparency</h4>
                            <p className="text-xs text-muted-foreground mt-1">Conflict between user privacy protection and system transparency</p>
                          </div>
                          <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">High Priority</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Stakeholders:</span> Users, Researchers, Regulators
                          </div>
                          <div>
                            <span className="font-medium">Resolution Progress:</span> 67%
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="text-xs">
                            View Resolution Strategy
                          </Button>
                        </div>
                      </div>

                      <div className="border border-chart-2/20 rounded-lg p-4 bg-chart-2/5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Efficiency vs. Thoroughness</h4>
                            <p className="text-xs text-muted-foreground mt-1">Balancing response speed with comprehensive analysis</p>
                          </div>
                          <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">Medium Priority</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Context:</span> Time-sensitive vs. Critical decisions
                          </div>
                          <div>
                            <span className="font-medium">Resolution Progress:</span> 89%
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="text-xs">
                            View Resolution Strategy
                          </Button>
                        </div>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Individual vs. Collective Good</h4>
                            <p className="text-xs text-muted-foreground mt-1">Optimizing for individual user benefit vs. broader societal impact</p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary">Low Priority</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Approach:</span> Contextual ethical framework selection
                          </div>
                          <div>
                            <span className="font-medium">Resolution Progress:</span> 34%
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="text-xs">
                            View Resolution Strategy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
