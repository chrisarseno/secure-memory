import { Card, CardContent } from "@/components/ui/card";
import { Brain, Lightbulb, Shield, GraduationCap } from "lucide-react";

interface MetricsProps {
  metrics?: {
    consciousnessCoherence: number;
    creativeIntelligence: number;
    safetyCompliance: number;
    learningEfficiency: number;
  };
}

export default function ConsciousnessMetrics({ metrics }: MetricsProps) {
  const metricCards = [
    {
      icon: Brain,
      value: metrics?.consciousnessCoherence || 0,
      label: "Consciousness Coherence",
      change: "+2.1%",
      color: "accent",
      testId: "metric-consciousness"
    },
    {
      icon: Lightbulb,
      value: metrics?.creativeIntelligence || 0,
      label: "Creative Intelligence",
      change: "+5.3%",
      color: "chart-2",
      testId: "metric-creative"
    },
    {
      icon: Shield,
      value: metrics?.safetyCompliance || 0,
      label: "Safety Compliance",
      change: "-0.2%",
      color: "chart-3",
      testId: "metric-safety"
    },
    {
      icon: GraduationCap,
      value: metrics?.learningEfficiency || 0,
      label: "Learning Efficiency",
      change: "+12.4%",
      color: "chart-4",
      testId: "metric-learning"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((metric, index) => (
        <Card key={index} className="bg-card border-border" data-testid={metric.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 bg-${metric.color}/10 rounded-lg`}>
                <metric.icon className={`h-5 w-5 text-${metric.color}`} />
              </div>
              <div className="metric-sparkline"></div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold" data-testid={`${metric.testId}-value`}>
                {metric.value.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className={`text-xs text-${metric.color}`} data-testid={`${metric.testId}-change`}>
                {metric.change} from yesterday
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
