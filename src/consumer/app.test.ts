import request from 'supertest';
import { createConsumerApp } from './app';
import { NotificationClient } from './notification.client';

jest.mock('./notification.client');

const MockedClient = NotificationClient as jest.MockedClass<typeof NotificationClient>;

const mockNotification = {
  id: 'notif-001',
  type: 'CASE_UPDATED' as const,
  caseId: 'DFT-2024-001',
  status: 'IN_PROGRESS',
  timestamp: '2024-01-15T10:30:00Z',
  metadata: { source: 'dynamics-365', version: '1.0.0' },
};

const mockNotificationResponse = {
  notifications: [mockNotification],
  total: 1,
  page: 1,
};

beforeEach(() => {
  MockedClient.mockClear();
});

describe('Consumer API', () => {
  describe('GET /health', () => {
    it('returns UP with producer status when producer is reachable', async () => {
      MockedClient.prototype.getHealth.mockResolvedValue({
        status: 'UP',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });

      const app = createConsumerApp();
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('notification-consumer');
      expect(res.body.producer.status).toBe('UP');
    });

    it('returns UP with UNREACHABLE producer when producer is down', async () => {
      MockedClient.prototype.getHealth.mockRejectedValue(new Error('ECONNREFUSED'));

      const app = createConsumerApp();
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.producer.status).toBe('UNREACHABLE');
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('returns enriched notifications list from producer', async () => {
      MockedClient.prototype.getNotifications.mockResolvedValue(mockNotificationResponse);

      const app = createConsumerApp();
      const res = await request(app).get('/api/v1/notifications');

      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.notifications[0].caseId).toBe('DFT-2024-001');
      expect(res.body.consumedBy).toBe('notification-consumer');
      expect(res.body.consumedAt).toBeDefined();
    });

    it('returns 500 when producer call fails', async () => {
      MockedClient.prototype.getNotifications.mockRejectedValue(new Error('Network error'));

      const app = createConsumerApp();
      const res = await request(app).get('/api/v1/notifications');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal consumer error');
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('returns enriched single notification', async () => {
      MockedClient.prototype.getNotificationById.mockResolvedValue(mockNotification);

      const app = createConsumerApp();
      const res = await request(app).get('/api/v1/notifications/notif-001');

      expect(res.status).toBe(200);
      expect(res.body.caseId).toBe('DFT-2024-001');
      expect(res.body.consumedBy).toBe('notification-consumer');
    });

    it('returns 404 when producer returns 404', async () => {
      const err: any = new Error('Not found');
      err.response = { status: 404 };
      MockedClient.prototype.getNotificationById.mockRejectedValue(err);

      const app = createConsumerApp();
      const res = await request(app).get('/api/v1/notifications/INVALID');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });
  });
});
