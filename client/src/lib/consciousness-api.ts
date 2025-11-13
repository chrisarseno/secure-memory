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
    const response = await apiRequest('/api/modules');
    return await response.json();
  }

  static async getModule(id: string): Promise<ConsciousnessModule> {
    const response = await apiRequest(`/api/modules/${id}`);
    return await response.json();
  }

  static async updateModule(id: string, updates: Partial<ConsciousnessModule>): Promise<ConsciousnessModule> {
    const response = await apiRequest(`/api/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await response.json();
  }

  static async getMetrics(): Promise<SystemMetrics> {
    const response = await apiRequest('/api/metrics');
    return await response.json();
  }

  static async getMetricsHistory(hours: number = 24): Promise<SystemMetrics[]> {
    const response = await apiRequest(`/api/metrics/history?hours=${hours}`);
    return await response.json();
  }

  static async getActivities(limit: number = 50): Promise<ActivityEvent[]> {
    const response = await apiRequest(`/api/activities?limit=${limit}`);
    return await response.json();
  }

  static async addActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const response = await apiRequest('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
    return await response.json();
  }

  static async getSafetyStatus(): Promise<SafetyStatus> {
    const response = await apiRequest('/api/safety');
    return await response.json();
  }

  static async getKnowledgeGraph(): Promise<KnowledgeGraph> {
    const response = await apiRequest('/api/knowledge-graph');
    return await response.json();
  }

  static async getCollaborationMessages(limit: number = 20): Promise<CollaborationMessage[]> {
    const response = await apiRequest(`/api/collaboration/messages?limit=${limit}`);
    return await response.json();
  }

  static async sendCollaborationMessage(message: Omit<CollaborationMessage, 'id' | 'timestamp'>): Promise<CollaborationMessage> {
    const response = await apiRequest('/api/collaboration/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return await response.json();
  }

  static async executeEmergencyAction(action: Omit<EmergencyAction, 'timestamp'>): Promise<EmergencyAction> {
    const response = await apiRequest('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    return await response.json();
  }

  static async getEmergencyHistory(): Promise<EmergencyAction[]> {
    const response = await apiRequest('/api/emergency/history');
    return await response.json();
  }
}
