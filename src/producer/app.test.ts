import request from 'supertest';
import { app } from './app';

describe('Producer API', () => {
  describe('GET /health', () => {
    it('should return 200 with UP status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('UP');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should return list of notifications', async () => {
      const response = await request(app).get('/api/v1/notifications');
      expect(response.status).toBe(200);
      expect(response.body.notifications).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.page).toBe(1);
    });

    it('should return notifications with correct structure', async () => {
      const response = await request(app).get('/api/v1/notifications');
      const notification = response.body.notifications[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('caseId');
      expect(notification).toHaveProperty('status');
      expect(notification).toHaveProperty('timestamp');
      expect(notification).toHaveProperty('metadata');
      expect(notification.metadata).toHaveProperty('source');
      expect(notification.metadata).toHaveProperty('version');
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should return a specific notification by id', async () => {
      const response = await request(app).get('/api/v1/notifications/notif-001');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('notif-001');
      expect(response.body.caseId).toBe('DFT-2024-001');
    });

    it('should return 404 for unknown notification id', async () => {
      const response = await request(app).get('/api/v1/notifications/notif-999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Notification not found');
    });
  });
});
