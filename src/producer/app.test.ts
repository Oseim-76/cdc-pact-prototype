import request from 'supertest';
import { app } from './app';

describe('Notification Producer API', () => {

  describe('GET /health', () => {
    it('returns 200 with status UP', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('returns version 1.0.0', async () => {
      const res = await request(app).get('/health');
      expect(res.body.version).toBe('1.0.0');
    });

    it('returns a valid ISO 8601 timestamp', async () => {
      const res = await request(app).get('/health');
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('returns all notifications with correct envelope structure', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.page).toBe('number');
    });

    it('returns notifications with all required contract fields', async () => {
      const res = await request(app).get('/api/v1/notifications');
      const n = res.body.notifications[0];
      expect(n.id).toBeDefined();
      expect(n.type).toBeDefined();
      expect(n.caseId).toBeDefined();
      expect(n.status).toBeDefined();
      expect(n.timestamp).toBeDefined();
      expect(n.metadata).toBeDefined();
      expect(n.metadata.source).toBeDefined();
      expect(n.metadata.version).toBeDefined();
    });

    it('filters by status query parameter', async () => {
      const res = await request(app).get('/api/v1/notifications?status=OPEN');
      expect(res.status).toBe(200);
      expect(res.body.notifications.every((n: { status: string }) => n.status === 'OPEN')).toBe(true);
    });

    it('filters by source query parameter', async () => {
      const res = await request(app).get('/api/v1/notifications?source=dynamics-365');
      expect(res.status).toBe(200);
      expect(res.body.notifications.every((n: { metadata: { source: string } }) => n.metadata.source === 'dynamics-365')).toBe(true);
    });

    it('filters by type query parameter', async () => {
      const res = await request(app).get('/api/v1/notifications?type=CASE_UPDATED');
      expect(res.status).toBe(200);
      expect(res.body.notifications.every((n: { type: string }) => n.type === 'CASE_UPDATED')).toBe(true);
    });

    it('returns empty array when filter matches nothing', async () => {
      const res = await request(app).get('/api/v1/notifications?status=CLOSED');
      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('combines multiple query filters correctly', async () => {
      const res = await request(app).get('/api/v1/notifications?status=OPEN&source=dynamics-365');
      expect(res.status).toBe(200);
      res.body.notifications.forEach((n: { status: string; metadata: { source: string } }) => {
        expect(n.status).toBe('OPEN');
        expect(n.metadata.source).toBe('dynamics-365');
      });
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('returns the correct notification for a valid ID', async () => {
      const res = await request(app).get('/api/v1/notifications/notif-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('notif-001');
      expect(res.body.caseId).toBe('DFT-2024-001');
    });

    it('returns 404 for an unknown notification ID', async () => {
      const res = await request(app).get('/api/v1/notifications/notif-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });
  });

});
