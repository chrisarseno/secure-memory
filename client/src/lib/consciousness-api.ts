import { apiRequest } from "@/lib/queryClient";
import type { 
  ConsciousnessModule, 
  SystemMetrics, 
  ActivityEvent, 
  SafetyStatus, 
  KnowledgeGraph, 
  CollaborationMessage, 
  EmergencyAction 
} from "../../../shared/schema";

export class ConsciousnessAPI {
  static async getModules(): Promise<ConsciousnessModule[]> {
    return apiRequest('/api/modules');
  }

  static async getModule(id: string): Promise<ConsciousnessModule> {
    return apiRequest(`/api/modules/${id}`);
  }

  static async updateModule(id: string, updates: Partial<ConsciousnessModule>): Promise<ConsciousnessModule> {
    return apiRequest(`/api/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  static async getMetrics(): Promise<SystemMetrics> {
    return apiRequest('/api/metrics');
  }

  static async getMetricsHistory(hours: number = 24): Promise<SystemMetrics[]> {
    return apiRequest(`/api/metrics/history?hours=${hours}`);
  }

  static async getActivities(limit: number = 50): Promise<ActivityEvent[]> {
    return apiRequest(`/api/activities?limit=${limit}`);
  }

  static async addActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    return apiRequest('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
  }

  static async getSafetyStatus(): Promise<SafetyStatus> {
    return apiRequest('/api/safety');
  }

  static async getKnowledgeGraph(): Promise<KnowledgeGraph> {
    return apiRequest('/api/knowledge-graph');
  }

  static async getCollaborationMessages(limit: number = 20): Promise<CollaborationMessage[]> {
    return apiRequest(`/api/collaboration/messages?limit=${limit}`);
  }

  static async sendCollaborationMessage(message: Omit<CollaborationMessage, 'id' | 'timestamp'>): Promise<CollaborationMessage> {
    return apiRequest('/api/collaboration/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  }

  static async executeEmergencyAction(action: Omit<EmergencyAction, 'timestamp'>): Promise<EmergencyAction> {
    return apiRequest('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
  }

  static async getEmergencyHistory(): Promise<EmergencyAction[]> {
    return apiRequest('/api/emergency/history');
  }
}
