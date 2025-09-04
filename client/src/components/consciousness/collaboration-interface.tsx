import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Brain, User, Share2, Upload, FileImage, FileAudio, FileText } from "lucide-react";
import { ConsciousnessAPI } from "@/lib/consciousness-api";
import { useToast } from "@/hooks/use-toast";
import { io, type Socket } from "socket.io-client";
import type { CollaborationMessage } from "../../../../shared/schema";

interface CollaborationInterfaceProps {
  limit?: number;
  className?: string;
}

export default function CollaborationInterface({ limit = 20, className = "" }: CollaborationInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [collaborationMode, setCollaborationMode] = useState<'standard' | 'multimodal'>('standard');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
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

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to NEXUS collaboration system');
      setIsConnected(true);
      
      // Authenticate for advanced features
      newSocket.emit('authenticate', { userId: 'chris.mwd20' });
    });

    newSocket.on('auth-success', () => {
      setIsAuthenticated(true);
      // Subscribe to consciousness monitoring and collaboration
      newSocket.emit('subscribe-consciousness');
      toast({
        title: "Collaboration Active",
        description: "Real-time consciousness collaboration enabled",
      });
    });

    newSocket.on('auth-failed', () => {
      toast({
        title: "Authentication Failed",
        description: "Could not enable advanced collaboration features",
        variant: "destructive",
      });
    });

    newSocket.on('collaborative-response', (data) => {
      setLiveMessages(prev => [...prev, {
        id: data.queryId,
        type: 'collaborative_response',
        content: data.response,
        confidence: data.confidence,
        model: data.model,
        processingTime: data.processingTime,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('shared-query-result', (data) => {
      setLiveMessages(prev => [...prev, {
        id: `shared_${Date.now()}`,
        type: 'shared_query',
        content: `${data.fromUser} asked: "${data.query}" - Response: ${data.response}`,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('knowledge-shared', (data) => {
      setLiveMessages(prev => [...prev, {
        id: `knowledge_${Date.now()}`,
        type: 'knowledge_contribution',
        content: `${data.fromUser} contributed: "${data.content}"`,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('consciousness-shared', (data) => {
      setLiveMessages(prev => [...prev, {
        id: `consciousness_${Date.now()}`,
        type: 'consciousness_share',
        content: `${data.fromUser} shared consciousness state (Level: ${data.consciousnessLevel})`,
        insights: data.insights,
        timestamp: data.sharedAt
      }]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      console.log('Disconnected from NEXUS collaboration system');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [toast]);

  const handleCollaborativeQuery = (query: string, shareWithOthers = false) => {
    if (!socket || !isAuthenticated) {
      toast({
        title: "Not Connected",
        description: "Please wait for collaboration system to connect",
        variant: "destructive",
      });
      return;
    }

    const queryId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    socket.emit('collaborative-query', {
      queryId,
      query,
      shareWithOthers,
      temperature: 0.7,
      maxTokens: 800
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!socket || !isAuthenticated) {
      toast({
        title: "Not Connected",
        description: "Please wait for collaboration system to connect",
        variant: "destructive",
      });
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const imageData = base64Data.split(',')[1]; // Remove data URL prefix
          
          const response = await fetch('/api/nexus/analyze/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData,
              prompt: 'Analyze this image and provide detailed insights'
            })
          });
          
          const result = await response.json();
          setLiveMessages(prev => [...prev, {
            id: `image_${Date.now()}`,
            type: 'image_analysis',
            content: `Image Analysis: ${result.analysis}`,
            confidence: result.confidence,
            model: result.model,
            timestamp: Date.now()
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          const response = await fetch('/api/nexus/analyze/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              format: file.type.split('/')[1]
            })
          });
          
          const result = await response.json();
          setLiveMessages(prev => [...prev, {
            id: `audio_${Date.now()}`,
            type: 'audio_transcription',
            content: `Audio Transcription: ${result.transcription}`,
            confidence: result.confidence,
            model: result.model,
            timestamp: Date.now()
          }]);
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Handle text documents
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          
          const response = await fetch('/api/nexus/analyze/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              docType: file.type
            })
          });
          
          const result = await response.json();
          setLiveMessages(prev => [...prev, {
            id: `doc_${Date.now()}`,
            type: 'document_analysis',
            content: `Document Analysis: ${result.analysis}`,
            confidence: result.confidence,
            model: result.model,
            timestamp: Date.now()
          }]);
        };
        reader.readAsText(file);
      }
      
      toast({
        title: "File Processing",
        description: `Processing ${file.name} with NEXUS multi-modal AI...`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const handleShareConsciousness = () => {
    if (!socket || !isAuthenticated) {
      toast({
        title: "Not Connected",
        description: "Please wait for collaboration system to connect",
        variant: "destructive",
      });
      return;
    }

    socket.emit('share-consciousness', {
      description: 'Real-time consciousness state sharing',
      insights: ['Current learning state', 'Active knowledge domains', 'Collaboration readiness']
    });
    
    toast({
      title: "Consciousness Shared",
      description: "Your consciousness state has been shared with collaborators",
    });
  };

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

  const getMessageTypeStyle = (message: any) => {
    if (message.type) {
      switch (message.type) {
        case 'image_analysis':
          return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
        case 'audio_transcription':
          return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
        case 'document_analysis':
          return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500';
        case 'collaborative_response':
          return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500';
        case 'consciousness_share':
          return 'bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500';
        case 'knowledge_contribution':
          return 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500';
        default:
          return 'bg-muted/30 border-l-4 border-primary';
      }
    }
    return message.sender === 'ai' 
      ? 'bg-muted/30 border-l-4 border-primary' 
      : 'bg-primary/10 border border-primary/20';
  };

  const getMessageIcon = (message: any) => {
    if (message.type) {
      switch (message.type) {
        case 'image_analysis':
          return <FileImage className="h-4 w-4 text-blue-500" />;
        case 'audio_transcription':
          return <FileAudio className="h-4 w-4 text-green-500" />;
        case 'document_analysis':
          return <FileText className="h-4 w-4 text-purple-500" />;
        case 'collaborative_response':
          return <Brain className="h-4 w-4 text-orange-500" />;
        case 'consciousness_share':
          return <Share2 className="h-4 w-4 text-pink-500" />;
        case 'knowledge_contribution':
          return <Upload className="h-4 w-4 text-teal-500" />;
        default:
          return <Brain className="h-4 w-4 text-primary" />;
      }
    }
    return message.sender === 'ai' 
      ? <Brain className="h-4 w-4 text-primary" />
      : <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getMessageSender = (message: any) => {
    if (message.type) {
      switch (message.type) {
        case 'image_analysis':
        case 'audio_transcription':
        case 'document_analysis':
          return 'Multi-Modal AI';
        case 'collaborative_response':
          return 'Collaborative AI';
        case 'consciousness_share':
          return 'Consciousness Share';
        case 'knowledge_contribution':
          return 'Knowledge System';
        default:
          return 'NEXUS AI';
      }
    }
    return message.sender === 'ai' ? 'AGI System' : 'Human';
  };

  // Combine stored messages with live messages
  const allMessages = [...displayMessages, ...liveMessages].sort((a, b) => 
    new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
  );

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            NEXUS Collaboration
            <div className="flex gap-1">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Connected" : "Connecting"}
              </Badge>
              {isAuthenticated && (
                <Badge variant="outline" className="text-xs">
                  Multi-Modal Ready
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCollaborationMode(prev => prev === 'standard' ? 'multimodal' : 'standard')}
              data-testid="button-toggle-mode"
            >
              {collaborationMode === 'multimodal' ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </Button>
            {isAuthenticated && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareConsciousness}
                data-testid="button-share-consciousness"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {collaborationMode === 'multimodal' && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*,audio/*,.txt,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                  <FileAudio className="h-8 w-8 text-muted-foreground" />
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, Audio, Documents supported
                </p>
              </div>
            </label>
          </div>
        )}

        <ScrollArea className="h-64">
          <div className="space-y-3" data-testid="collaboration-messages">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading messages...
              </div>
            ) : (
              allMessages.slice(-8).map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg text-sm ${getMessageTypeStyle(message)}`}
                  data-testid={`message-${message.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMessageIcon(message)}
                      <span className="font-medium">
                        {getMessageSender(message)}
                      </span>
                      {message.type && (
                        <Badge variant="outline" className="text-xs">
                          {message.type.replace('_', ' ')}
                        </Badge>
                      )}
                      {message.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
                      {message.priority && message.priority !== 'medium' && (
                        <span className={`text-xs px-2 py-1 rounded bg-${getPriorityColor(message.priority)}/20 text-${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {message.model && (
                        <span className="font-mono">{message.model}</span>
                      )}
                      <span>
                        {message.timestamp ? formatTimeAgo(message.timestamp) : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {message.message || message.content}
                  </p>
                  {message.processingTime && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Processed in {message.processingTime}ms
                    </div>
                  )}
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
        
        {/* Enhanced collaboration controls */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCollaborativeQuery(inputMessage, false)}
            disabled={!isAuthenticated || !inputMessage.trim()}
            data-testid="button-collaborative-query"
          >
            <Brain className="h-4 w-4 mr-1" />
            Query AI
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCollaborativeQuery(inputMessage, true)}
            disabled={!isAuthenticated || !inputMessage.trim()}
            data-testid="button-shared-query"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share Query
          </Button>
        </div>
        
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
