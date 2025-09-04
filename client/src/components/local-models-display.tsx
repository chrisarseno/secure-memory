import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Cpu, HardDrive, Zap } from "lucide-react";

interface LocalModel {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  memoryMB: number;
  specialized: string;
}

export default function LocalModelsDisplay() {
  const { data: models = [], isLoading, refetch } = useQuery<LocalModel[]>({
    queryKey: ['/api/local-models'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-accent text-accent-foreground';
      case 'available': return 'bg-chart-2 text-white';
      case 'loading': return 'bg-chart-3 text-white';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ollama': return '🦙';
      case 'llamacpp': return '🚀';
      case 'transformers': return '🤖';
      default: return '⚡';
    }
  };

  const getSpecializationColor = (specialized: string) => {
    switch (specialized) {
      case 'reasoning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'creative': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'analysis': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'verification': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Local AI Models
            <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Scanning for local models...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Local AI Models
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {models.length} model{models.length !== 1 ? 's' : ''} detected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="text-center py-8">
            <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground mb-2">No local models detected</div>
            <div className="text-sm text-muted-foreground">
              Ollama and Jan models are currently not available in this environment
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((model) => (
              <div 
                key={model.id} 
                className="border rounded-lg p-4 bg-muted/30"
                data-testid={`local-model-${model.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(model.type)}</span>
                    <div>
                      <h3 className="font-medium text-sm">{model.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {model.type.toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs ${getSpecializationColor(model.specialized)}`}>
                          {model.specialized}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(model.status)} text-xs`}>
                    {model.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    <span>{(model.memoryMB / 1024).toFixed(1)}GB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{model.capabilities.length} capabilities</span>
                  </div>
                </div>
                
                {model.capabilities.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((capability) => (
                        <Badge 
                          key={capability} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}