import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import type { ConsciousnessModule } from "../../../../shared/schema";

interface ModuleStatusGridProps {
  modules?: ConsciousnessModule[];
  showAll?: boolean;
  onToggleShowAll?: () => void;
}

export default function ModuleStatusGrid({ 
  modules: initialModules = [], 
  showAll = false, 
  onToggleShowAll 
}: ModuleStatusGridProps) {
  const [modules, setModules] = useState<ConsciousnessModule[]>(initialModules);
  const { socket } = useWebSocket();

  // Listen for real-time module updates
  useEffect(() => {
    if (socket) {
      socket.on('module-update', (updatedModule: ConsciousnessModule) => {
        setModules(prev => prev.map(m => 
          m.id === updatedModule.id ? updatedModule : m
        ));
      });

      return () => {
        socket.off('module-update');
      };
    }
  }, [socket]);

  // Update modules when props change
  useEffect(() => {
    if (initialModules.length > 0) {
      setModules(initialModules);
    }
  }, [initialModules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent';
      case 'warning': return 'bg-chart-3';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getModuleIcon = (moduleId: string) => {
    const iconMap: Record<string, string> = {
      'global_workspace': 'fas fa-brain',
      'social_cognition': 'fas fa-users',
      'temporal_consciousness': 'fas fa-clock',
      'value_learning': 'fas fa-balance-scale',
      'virtue_learning': 'fas fa-heart',
      'creative_intelligence': 'fas fa-lightbulb',
    };
    return iconMap[moduleId] || 'fas fa-cog';
  };

  const getMetricDisplay = (module: ConsciousnessModule) => {
    const metrics = module.metrics;
    if (module.id === 'global_workspace') {
      return (
        <>
          <p>Integration: {metrics.integration || module.integrationLevel}%</p>
          <p>Load: {metrics.load || module.load}%</p>
        </>
      );
    }
    if (module.id === 'social_cognition') {
      return (
        <>
          <p>Theory of Mind: {metrics.theoryOfMind || 89}%</p>
          <p>Agents Tracked: {metrics.agentsTracked || 23}</p>
        </>
      );
    }
    if (module.id === 'temporal_consciousness') {
      return (
        <>
          <p>Narrative Coherence: {metrics.narrativeCoherence || 92}%</p>
          <p>Future Projections: {metrics.futureProjections || 156}</p>
        </>
      );
    }
    if (module.id === 'value_learning') {
      return (
        <>
          <p>Values Evolved: {metrics.valuesEvolved || 247}</p>
          <p>Conflicts: {metrics.conflicts || 3} pending</p>
        </>
      );
    }
    if (module.id === 'virtue_learning') {
      return (
        <>
          <p>Character Score: {metrics.characterScore || 84}%</p>
          <p>Wisdom Level: {metrics.wisdomLevel || 'High'}</p>
        </>
      );
    }
    if (module.id === 'creative_intelligence') {
      return (
        <>
          <p>Novelty Score: {metrics.noveltyScore || 91}%</p>
          <p>Concepts Generated: {metrics.conceptsGenerated || 1247}</p>
        </>
      );
    }
    return (
      <>
        <p>Integration: {module.integrationLevel}%</p>
        <p>Load: {module.load}%</p>
      </>
    );
  };

  const displayedModules = showAll ? modules : modules.slice(0, 6);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">AI Module Status</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full status-pulse"></div>
            <span className="text-sm text-muted-foreground" data-testid="modules-online-count">
              {modules.filter(m => m.status === 'active').length} modules active
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="module-grid">
          {displayedModules.map((module) => (
            <div 
              key={module.id} 
              className="bg-muted/30 border border-border rounded-lg p-4"
              data-testid={`module-${module.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className={`${getModuleIcon(module.id)} text-primary`}></i>
                  <span className="font-medium">{module.name}</span>
                </div>
                <div className={`w-2 h-2 ${getStatusColor(module.status)} rounded-full`}></div>
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`module-${module.id}-metrics`}>
                {getMetricDisplay(module)}
              </div>
            </div>
          ))}
        </div>
        
        {modules.length > 6 && onToggleShowAll && (
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={onToggleShowAll}
            data-testid="button-show-more-modules"
          >
            <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? `Show less` : `Show ${modules.length - 6} more modules`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
