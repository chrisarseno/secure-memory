import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConsciousness } from "@/hooks/use-consciousness";

export default function Sidebar() {
  const [location] = useLocation();
  const { metrics, connectionStatus } = useConsciousness();

  const navigationItems = [
    { path: "/", icon: "fas fa-tachometer-alt", label: "Dashboard", testId: "nav-dashboard" },
    { path: "/consciousness-core", icon: "fas fa-brain", label: "Consciousness Core", testId: "nav-consciousness" },
    { path: "/knowledge-graph", icon: "fas fa-project-diagram", label: "Knowledge Graph", testId: "nav-knowledge" },
    { path: "/social-cognition", icon: "fas fa-users", label: "Social Cognition", testId: "nav-social" },
    { path: "/temporal-awareness", icon: "fas fa-clock", label: "Temporal Awareness", testId: "nav-temporal" },
    { path: "/creative-intelligence", icon: "fas fa-lightbulb", label: "Creative Intelligence", testId: "nav-creative" },
    { path: "/value-system", icon: "fas fa-balance-scale", label: "Value System", testId: "nav-values" },
    { path: "/safety-monitor", icon: "fas fa-shield-alt", label: "Safety Monitor", testId: "nav-safety" },
  ];

  const quickActions = [
    { icon: "fas fa-play", label: "Start Learning Session", testId: "button-start-learning" },
    { icon: "fas fa-pause", label: "Emergency Pause", testId: "button-emergency-pause" },
    { icon: "fas fa-download", label: "Export State", testId: "button-export-state" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & System Status */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center consciousness-glow">
            <i className="fas fa-brain text-primary-foreground text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold">AGI Consciousness</h1>
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
              {metrics?.modulesOnline || 0}/{metrics?.totalModules || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Consciousness Level</span>
            <span className="text-accent font-medium">
              {metrics?.consciousnessCoherence?.toFixed(1) || 0}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid={item.testId}
              >
                <i className={`${item.icon} w-4`}></i>
                {item.label}
              </a>
            </Link>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <button 
                key={action.testId}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-sm"
                data-testid={action.testId}
              >
                <i className={`${action.icon} w-4`}></i>
                {action.label}
              </button>
            ))}
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
  );
}
