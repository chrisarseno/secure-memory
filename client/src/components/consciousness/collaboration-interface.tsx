import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Brain, User } from "lucide-react";
import { ConsciousnessAPI } from "@/lib/consciousness-api";
import { useToast } from "@/hooks/use-toast";
import type { CollaborationMessage } from "../../../../shared/schema";

interface CollaborationInterfaceProps {
  limit?: number;
  className?: string;
}

export default function CollaborationInterface({ limit = 20, className = "" }: CollaborationInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch collaboration messages
  const { data: messages = [], isLoading } = useQuery<CollaborationMessage[]>({
    queryKey: ['/api/collaboration/messages'],
    queryFn: () => ConsciousnessAPI.getCollaborationMessages(limit),
    refetchInterval: 10000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: { sender: "human"; message: string; requiresResponse: boolean; priority: "medium" }) => 
      ConsciousnessAPI.sendCollaborationMessage(message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/messages'] });
      setInputMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the AGI system.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessageMutation.mutate({
      sender: "human",
      message: inputMessage.trim(),
      requiresResponse: true,
      priority: "medium",
    });
  };

  // Add default AI message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: "default",
      sender: "ai" as const,
      message: "I've identified an ethical concern in the value learning module that requires human guidance. The system is learning contradictory values about privacy vs. transparency from different cultural contexts.",
      timestamp: new Date().toISOString(),
      requiresResponse: true,
      priority: "high" as const,
    }
  ] : messages;

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'chart-3';
      case 'medium': return 'chart-2';
      default: return 'muted';
    }
  };

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64">
          <div className="space-y-3" data-testid="collaboration-messages">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading messages...
              </div>
            ) : (
              displayMessages.slice(-5).map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg text-sm ${
                    message.sender === 'ai' 
                      ? 'bg-muted/30 border-l-4 border-primary' 
                      : 'bg-primary/10 border border-primary/20'
                  }`}
                  data-testid={`message-${message.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.sender === 'ai' ? (
                        <Brain className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {message.sender === 'ai' ? 'AGI System' : 'Human'}
                      </span>
                      {message.priority !== 'medium' && (
                        <span className={`text-xs px-2 py-1 rounded bg-${getPriorityColor(message.priority)}/20 text-${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{message.message}</p>
                  {message.requiresResponse && message.sender === 'ai' && (
                    <div className="mt-2 text-xs text-chart-3">
                      • Requires response
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your response..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1"
            data-testid="input-collaboration-message"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={sendMessageMutation.isPending || !inputMessage.trim()}
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
