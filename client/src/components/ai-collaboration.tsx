import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CollaborationMessage } from "../../../shared/schema";

export default function AICollaboration() {
  const [inputMessage, setInputMessage] = useState("");
  const queryClient = useQueryClient();

  // Fetch collaboration messages
  const { data: messages = [] } = useQuery<CollaborationMessage[]>({
    queryKey: ['/api/collaboration/messages'],
    refetchInterval: 10000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: { sender: "human"; message: string; requiresResponse: boolean; priority: "medium" }) => 
      apiRequest('/api/collaboration/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/messages'] });
      setInputMessage("");
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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">AI Collaboration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-40">
          <div className="space-y-3" data-testid="collaboration-messages">
            {displayMessages.slice(-3).map((message) => (
              <div 
                key={message.id} 
                className={`p-3 rounded-lg text-sm ${
                  message.sender === 'ai' 
                    ? 'bg-muted/30' 
                    : 'bg-primary/10 border border-primary/20'
                }`}
                data-testid={`message-${message.id}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">
                    {message.sender === 'ai' ? '🤖 AGI System' : '👤 Human'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(message.timestamp)}
                  </span>
                </div>
                <p className="text-muted-foreground">{message.message}</p>
              </div>
            ))}
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
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
