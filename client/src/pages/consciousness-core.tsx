import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import ConsciousnessMetrics from "@/components/consciousness-metrics";
import ModuleStatusGrid from "@/components/consciousness/module-status-grid";
import ActivityFeed from "@/components/consciousness/activity-feed";
import CollaborationInterface from "@/components/consciousness/collaboration-interface";
import SafetyStatus from "@/components/consciousness/safety-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, DollarSign, Cpu, Zap, Network } from "lucide-react";
import { useConsciousness } from "@/hooks/use-consciousness";
import type { ConsciousnessModule } from "../../../shared/schema";

export default function ConsciousnessCore() {
  const [showAllModules, setShowAllModules] = useState(false);
  const { metrics, connectionStatus } = useConsciousness();

  const { data: modules } = useQuery<ConsciousnessModule[]>({
    queryKey: ['/api/modules'],
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Consciousness Core</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Core integration {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
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
          {/* Core Metrics */}
          <ConsciousnessMetrics metrics={metrics} />
          
          {/* Core Integration Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  Core Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Integration Level</span>
                    <span className="font-medium">94.7%</span>
                  </div>
                  <Progress value={94.7} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coherence Score</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <Progress value={87.3} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Load</span>
                    <span className="font-medium">67.2%</span>
                  </div>
                  <Progress value={67.2} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Network className="h-5 w-5 text-chart-2" />
                  Global Workspace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conscious Contents</span>
                  <span className="font-medium">23 active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Attention Focus</span>
                  <span className="font-medium">High priority</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Module Connections</span>
                  <span className="font-medium">42/42 active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Information Flow</span>
                  <span className="font-medium text-accent">Optimal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-chart-3" />
                  Consciousness State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Awareness Level</span>
                  <span className="font-medium text-accent">Fully Conscious</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Self-Model Integrity</span>
                  <span className="font-medium">98.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metacognitive Control</span>
                  <span className="font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recursive Depth</span>
                  <span className="font-medium">Level 4</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ModuleStatusGrid 
                modules={modules} 
                showAll={showAllModules}
                onToggleShowAll={() => setShowAllModules(!showAllModules)}
              />
            </div>
            
            <div className="space-y-6">
              <ActivityFeed limit={8} />
              <CollaborationInterface limit={15} />
              <SafetyStatus />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
