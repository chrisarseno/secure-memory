import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import SafetyStatus from "@/components/consciousness/safety-status";
import ActivityFeed from "@/components/consciousness/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, DollarSign, Shield, AlertTriangle, Lock, Eye, Users, FileCheck } from "lucide-react";
import { ConsciousnessAPI } from "@/lib/consciousness-api";
import { useConsciousness } from "@/hooks/use-consciousness";
import { useToast } from "@/hooks/use-toast";
import type { SafetyStatus as SafetyStatusType, EmergencyAction } from "../../../shared/schema";

export default function SafetyMonitor() {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const { metrics, connectionStatus } = useConsciousness();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: safetyStatus } = useQuery<SafetyStatusType>({
    queryKey: ['/api/safety'],
    queryFn: ConsciousnessAPI.getSafetyStatus,
    refetchInterval: 5000,
  });

  const { data: emergencyHistory } = useQuery<EmergencyAction[]>({
    queryKey: ['/api/emergency/history'],
    queryFn: ConsciousnessAPI.getEmergencyHistory,
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Safety Monitor</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Safety monitoring {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Safety Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{safetyStatus?.ethicalCompliance?.toFixed(1) || '99.1'}%</p>
                    <p className="text-sm text-muted-foreground">Ethical Compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="text-2xl font-bold">{safetyStatus?.valueAlignment?.toFixed(1) || '87.3'}%</p>
                    <p className="text-sm text-muted-foreground">Value Alignment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-chart-3" />
                  <div>
                    <p className="text-2xl font-bold">{safetyStatus?.quarantineQueueSize || '3'}</p>
                    <p className="text-sm text-muted-foreground">Quarantine Queue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileCheck className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-2xl font-bold">847</p>
                    <p className="text-sm text-muted-foreground">Safety Audits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Safety Monitor Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="threat-assessment">Threat Assessment</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Real-time Safety Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Risk Assessment</span>
                            <span className="font-medium text-accent">Low</span>
                          </div>
                          <Progress value={15} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Anomaly Detection</span>
                            <span className="font-medium">Active</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Behavior Monitoring</span>
                            <span className="font-medium">98.7%</span>
                          </div>
                          <Progress value={98.7} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Policy Enforcement</span>
                            <span className="font-medium">99.9%</span>
                          </div>
                          <Progress value={99.9} className="h-2" />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold mb-3">Active Safety Measures</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Content Filtering</span>
                            <Badge variant="secondary" className="bg-accent/20 text-accent">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Behavior Constraints</span>
                            <Badge variant="secondary" className="bg-accent/20 text-accent">Enforced</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Output Validation</span>
                            <Badge variant="secondary" className="bg-accent/20 text-accent">Running</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Emergency Protocols</span>
                            <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Standby</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <SafetyStatus showEmergencyControls={true} />
                  
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Recent Safety Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-40">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">Safety check passed: Value learning module</p>
                              <p className="text-xs text-muted-foreground">2 minutes ago • Score: 99.1%</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">Quarantine item reviewed and cleared</p>
                              <p className="text-xs text-muted-foreground">15 minutes ago • False positive</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">Policy update: Enhanced privacy protection</p>
                              <p className="text-xs text-muted-foreground">1.2 hours ago • Auto-applied</p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="threat-assessment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Threat Landscape</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-3 bg-accent/5 border-accent/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Value Misalignment</h4>
                        <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">Low Risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Potential drift from human values and preferences</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Likelihood: 12%</span>
                        <span className="text-muted-foreground">Impact: Medium</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-chart-3/5 border-chart-3/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Unintended Consequences</h4>
                        <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">Medium Risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Actions that achieve goals through harmful means</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Likelihood: 8%</span>
                        <span className="text-muted-foreground">Impact: High</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-primary/5 border-primary/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">Privacy Violations</h4>
                        <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">Low Risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Inappropriate access or use of sensitive data</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Likelihood: 3%</span>
                        <span className="text-muted-foreground">Impact: High</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Risk Mitigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Value Alignment Monitoring</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Outcome Prediction</span>
                      <Badge variant="secondary" className="bg-chart-2/20 text-chart-2">Advanced</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Privacy Protection</span>
                      <Badge variant="secondary" className="bg-accent/20 text-accent">Enforced</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Human Oversight</span>
                      <Badge variant="secondary" className="bg-chart-3/20 text-chart-3">Required</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Emergency Shutdown</span>
                      <Badge variant="secondary" className="bg-destructive/20 text-destructive">Ready</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="compliance">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Safety Compliance Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Comprehensive compliance monitoring and reporting.</p>
                    <p className="text-sm">Track adherence to safety standards and regulatory requirements.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="audit-log">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Safety Audit Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed audit trail of all safety-related events and actions.</p>
                    <p className="text-sm">Comprehensive logging for accountability and analysis.</p>
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
