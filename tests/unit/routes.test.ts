import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRoutes } from '../../server/routes';

// Mock storage
const mockStorage = {
  getModules: vi.fn().mockResolvedValue([
    { id: '1', name: 'test-module', status: 'active', integrationLevel: 85 }
  ]),
  getLatestMetrics: vi.fn().mockResolvedValue({
    consciousnessCoherence: 85,
    creativeIntelligence: 72,
    safetyCompliance: 95,
    learningEfficiency: 68,
    costPerHour: 0.15,
    modulesOnline: 8,
    totalModules: 10,
    timestamp: new Date()
  }),
  getRecentActivities: vi.fn().mockResolvedValue([]),
  getLatestSafetyStatus: vi.fn().mockResolvedValue({
    ethicalCompliance: 95,
    valueAlignment: 90,
    safetyConstraints: [],
    quarantineQueueSize: 0
  }),
  getKnowledgeGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  getCollaborationMessages: vi.fn().mockResolvedValue([]),
  getEmergencyHistory: vi.fn().mockResolvedValue([]),
  getMetricsHistory: vi.fn().mockResolvedValue([]),
};

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(createRoutes(mockStorage as any));
  });

  describe('Health Checks', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return readiness status', async () => {
      const response = await request(app).get('/ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('Consciousness Modules', () => {
    it('should get all modules', async () => {
      const response = await request(app).get('/api/modules');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(mockStorage.getModules).toHaveBeenCalled();
    });
  });

  describe('System Metrics', () => {
    it('should get latest metrics', async () => {
      const response = await request(app).get('/api/metrics');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('consciousnessCoherence');
      expect(mockStorage.getLatestMetrics).toHaveBeenCalled();
    });
  });
});
