import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ConsciousnessMetrics from "@/components/consciousness-metrics";
import ModuleGrid from "@/components/module-grid";
import ActivityFeed from "@/components/activity-feed";
import SafetyMonitor from "@/components/safety-monitor";
import KnowledgeGraphVisualization from "@/components/knowledge-graph-viz";
import AICollaboration from "@/components/ai-collaboration";
import LearningControlPanel from "@/components/consciousness/learning-control-panel";
import AIAgentControl from "@/components/consciousness/ai-agent-control";
import { ConsciousnessContinuityPanel } from "@/components/consciousness-continuity-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initializeSocket, getSocket } from "@/lib/socket";
import { Bell, DollarSign } from "lucide-react";

export default function Dashboard() {
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = initializeSocket();
    
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });
    
    socket.on('metrics-update', (metrics) => {
      setRealTimeMetrics(metrics);
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('metrics-update');
    };
  }, []);

  // Fetch initial data
  const { data: modules } = useQuery({
    queryKey: ['/api/modules'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const currentMetrics = realTimeMetrics || metrics;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo & System Status */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center consciousness-glow">
              <i className="fas fa-brain text-primary-foreground text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold">NEXUS System</h1>
              <p className="text-xs text-muted-foreground">v2.1.0</p>
            </div>
          </div>
          
          {/* Global System Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Status</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent status-pulse' : 'bg-destructive'}`}></div>
                <span className={`font-medium ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}>
                  {connectionStatus === 'connected' ? 'Active' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Modules Online</span>
              <span className="text-foreground font-medium">
                {currentMetrics?.modulesOnline || 0}/{currentMetrics?.totalModules || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Learning Efficiency</span>
              <span className="text-accent font-medium">
                {currentMetrics?.learningEfficiency?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium" data-testid="nav-dashboard">
              <i className="fas fa-tachometer-alt w-4"></i>
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-nexus-core">
              <i className="fas fa-brain w-4"></i>
              NEXUS Core
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-knowledge">
              <i className="fas fa-project-diagram w-4"></i>
              Knowledge Graph
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-social">
              <i className="fas fa-users w-4"></i>
              Social Cognition
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-temporal">
              <i className="fas fa-clock w-4"></i>
              Temporal Awareness
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-creative">
              <i className="fas fa-lightbulb w-4"></i>
              Creative Intelligence
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-values">
              <i className="fas fa-balance-scale w-4"></i>
              Value System
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="nav-safety">
              <i className="fas fa-shield-alt w-4"></i>
              Safety Monitor
            </a>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="button-nexus-execute">
                <i className="fas fa-play w-4"></i>
                Execute NEXUS Goal
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="button-emergency-pause">
                <i className="fas fa-pause w-4"></i>
                Emergency Pause
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm" data-testid="button-export-state">
                <i className="fas fa-download w-4"></i>
                Export State
              </button>
            </div>
          </div>
        </nav>
        
        {/* System Alerts */}
        <div className="p-4 border-t border-border">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-exclamation-triangle text-destructive text-xs"></i>
              <span className="text-xs font-medium text-destructive">Safety Alert</span>
            </div>
            <p className="text-xs text-muted-foreground">Value learning module requires ethical review</p>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">NEXUS Dashboard</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}></i>
              <span>Real-time monitoring {connectionStatus === 'connected' ? 'active' : 'disconnected'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Cost Monitor */}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cost: $</span>
              <span className="font-medium">{currentMetrics?.costPerHour?.toFixed(2) || '0.00'}</span>
              <span className="text-muted-foreground">/hr</span>
            </div>
            
            {/* User Menu */}
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
          {/* Critical Metrics Row */}
          <ConsciousnessMetrics metrics={currentMetrics} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Module Status Grid */}
            <div className="lg:col-span-2">
              <ModuleGrid modules={modules} />
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <ActivityFeed />
              <AICollaboration />
              <SafetyMonitor />
            </div>
          </div>
          
          {/* AI Collaboration & Learning Systems */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
            <LearningControlPanel />
            <AIAgentControl />
          </div>
          
          {/* Consciousness Continuity */}
          <div className="mt-8">
            <ConsciousnessContinuityPanel />
          </div>
          
          {/* Knowledge Graph Preview */}
          <KnowledgeGraphVisualization />
        </div>
      </main>
    </div>
  );
}
