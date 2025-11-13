import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/hooks/use-websocket";
import type { ActivityEvent } from "../../../../shared/schema";

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export default function ActivityFeed({ limit = 10, showHeader = true, className = "" }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const { socket } = useWebSocket();

  // Fetch initial activities
  const { data: initialActivities } = useQuery<ActivityEvent[]>({
    queryKey: ['/api/activities'],
    refetchInterval: 30000,
  });

  // Listen for real-time activity updates
  useEffect(() => {
    if (socket) {
      socket.on('activity-update', (newActivity: ActivityEvent) => {
        setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
      });

      return () => {
        socket.off('activity-update');
      };
    }
  }, [socket, limit]);

  // Update activities when initial data loads
  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities.slice(0, limit));
    }
  }, [initialActivities, limit]);

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'virtue': 'accent',
      'creative': 'chart-2',
      'social': 'chart-3',
      'temporal': 'chart-4',
      'knowledge': 'primary',
      'safety': 'destructive',
      'error': 'destructive'
    };
    return colorMap[type] || 'muted';
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const content = (
    <div className="space-y-3" data-testid="activity-feed">
      {activities.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">
          No recent activities
        </div>
      ) : (
        activities.map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-start gap-3"
            data-testid={`activity-${activity.id}`}
          >
            <div className={`w-2 h-2 bg-${getActivityColor(activity.type)} rounded-full mt-2 status-pulse`}></div>
            <div className="flex-1">
              <p className="text-sm text-foreground" data-testid={`activity-${activity.id}-message`}>
                {activity.message}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`activity-${activity.id}-time`}>
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (!showHeader) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Live Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {content}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
