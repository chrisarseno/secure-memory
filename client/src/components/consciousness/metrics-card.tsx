import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  change: string;
  color: string;
  testId: string;
  format?: 'percentage' | 'number' | 'currency';
}

export default function MetricsCard({ 
  icon: Icon, 
  value, 
  label, 
  change, 
  color, 
  testId, 
  format = 'percentage' 
}: MetricsCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toFixed(2)}`;
      case 'number':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 bg-${color}/10 rounded-lg`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          <div className="metric-sparkline"></div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {formatValue(value)}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-xs text-${color}`} data-testid={`${testId}-change`}>
            {change} from yesterday
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
