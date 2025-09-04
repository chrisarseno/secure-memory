import { Card, CardContent } from "@/components/ui/card";
import { Brain, Lightbulb, Shield, GraduationCap } from "lucide-react";

interface MetricsProps {
  metrics?: {
    consciousnessCoherence: number;
    creativeIntelligence: number;
    safetyCompliance: number;
    learningEfficiency: number;
    previousMetrics?: {
      consciousnessCoherence: number;
      creativeIntelligence: number;
      safetyCompliance: number;
      learningEfficiency: number;
    };
  };
}

export default function ConsciousnessMetrics({ metrics }: MetricsProps) {
  // Calculate real percentage changes from previous metrics
  const calculateChange = (current: number, previous: number | undefined): string => {
    if (!previous || previous === 0) return "New";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (current: number, previous: number | undefined): string => {
    if (!previous) return "muted-foreground";
    const change = current - previous;
    return change >= 0 ? "green-500" : "red-500";
  };

  const metricCards = [
    {
      icon: Brain,
      value: metrics?.consciousnessCoherence || 0,
      label: "Consciousness Coherence",
      change: calculateChange(metrics?.consciousnessCoherence || 0, metrics?.previousMetrics?.consciousnessCoherence),
      changeColor: getChangeColor(metrics?.consciousnessCoherence || 0, metrics?.previousMetrics?.consciousnessCoherence),
      color: "accent",
      testId: "metric-consciousness"
    },
    {
      icon: Lightbulb,
      value: metrics?.creativeIntelligence || 0,
      label: "Creative Intelligence",
      change: calculateChange(metrics?.creativeIntelligence || 0, metrics?.previousMetrics?.creativeIntelligence),
      changeColor: getChangeColor(metrics?.creativeIntelligence || 0, metrics?.previousMetrics?.creativeIntelligence),
      color: "chart-2",
      testId: "metric-creative"
    },
    {
      icon: Shield,
      value: metrics?.safetyCompliance || 0,
      label: "Safety Compliance",
      change: calculateChange(metrics?.safetyCompliance || 0, metrics?.previousMetrics?.safetyCompliance),
      changeColor: getChangeColor(metrics?.safetyCompliance || 0, metrics?.previousMetrics?.safetyCompliance),
      color: "chart-3",
      testId: "metric-safety"
    },
    {
      icon: GraduationCap,
      value: metrics?.learningEfficiency || 0,
      label: "Learning Efficiency",
      change: calculateChange(metrics?.learningEfficiency || 0, metrics?.previousMetrics?.learningEfficiency),
      changeColor: getChangeColor(metrics?.learningEfficiency || 0, metrics?.previousMetrics?.learningEfficiency),
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
              <p className={`text-xs text-${metric.changeColor}`} data-testid={`${metric.testId}-change`}>
                {metric.change} from last hour
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
