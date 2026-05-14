import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import axios from 'axios';

const { like, eachLike, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'NotificationConsumer',
  provider: 'NotificationProducer',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Notification Consumer Pact Tests', () => {
  describe('GET /api/v1/notifications', () => {
    it('should receive a list of notifications', async () => {
      await provider
        .addInteraction({
          states: [{ description: 'notifications exist' }],
          uponReceiving: 'a request for all notifications',
          withRequest: {
            method: 'GET',
            path: '/api/v1/notifications',
            headers: { Accept: 'application/json' },
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              notifications: eachLike({
                id: like('notif-001'),
                type: regex('CASE_UPDATED|CASE_CREATED|CASE_CLOSED', 'CASE_UPDATED'),
                caseId: like('DFT-2024-001'),
                status: like('IN_PROGRESS'),
                timestamp: like('2024-01-15T10:30:00Z'),
                metadata: {
                  source: like('dynamics-365'),
                  version: like('1.0.0'),
                },
              }),
              total: like(1),
              page: like(1),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/api/v1/notifications`,
            { headers: { Accept: 'application/json' } }
          );
          expect(response.status).toBe(200);
          expect(response.data.notifications).toBeInstanceOf(Array);
          expect(response.data.notifications[0]).toHaveProperty('id');
          expect(response.data.notifications[0]).toHaveProperty('caseId');
          expect(response.data.notifications[0]).toHaveProperty('metadata');
          expect(response.data.total).toBeDefined();
          expect(response.data.page).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should receive a single notification by id', async () => {
      await provider
        .addInteraction({
          states: [{ description: 'notification notif-001 exists' }],
          uponReceiving: 'a request for notification notif-001',
          withRequest: {
            method: 'GET',
            path: '/api/v1/notifications/notif-001',
            headers: { Accept: 'application/json' },
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              id: like('notif-001'),
              type: regex('CASE_UPDATED|CASE_CREATED|CASE_CLOSED', 'CASE_UPDATED'),
              caseId: like('DFT-2024-001'),
              status: like('IN_PROGRESS'),
              timestamp: like('2024-01-15T10:30:00Z'),
              metadata: {
                source: like('dynamics-365'),
                version: like('1.0.0'),
              },
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/api/v1/notifications/notif-001`,
            { headers: { Accept: 'application/json' } }
          );
          expect(response.status).toBe(200);
          expect(response.data.id).toBeDefined();
          expect(response.data.caseId).toBeDefined();
        });
    });

    it('should handle notification not found', async () => {
      await provider
        .addInteraction({
          states: [{ description: 'notification notif-999 does not exist' }],
          uponReceiving: 'a request for a non-existent notification',
          withRequest: {
            method: 'GET',
            path: '/api/v1/notifications/notif-999',
            headers: { Accept: 'application/json' },
          },
          willRespondWith: {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: {
              error: like('Notification not found'),
            },
          },
        })
        .executeTest(async (mockServer) => {
          try {
            await axios.get(
              `${mockServer.url}/api/v1/notifications/notif-999`,
              { headers: { Accept: 'application/json' } }
            );
          } catch (error: any) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.error).toBeDefined();
          }
        });
    });
  });

  describe('GET /health', () => {
    it('should receive a health check response', async () => {
      await provider
        .addInteraction({
          states: [{ description: 'producer is running' }],
          uponReceiving: 'a health check request',
          withRequest: {
            method: 'GET',
            path: '/health',
            headers: { Accept: 'application/json' },
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
              status: like('UP'),
              version: like('1.0.0'),
              timestamp: like('2024-01-15T10:30:00Z'),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/health`,
            { headers: { Accept: 'application/json' } }
          );
          expect(response.status).toBe(200);
          expect(response.data.status).toBe('UP');
          expect(response.data.version).toBeDefined();
        });
    });
  });
});
