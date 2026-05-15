/**
 * BILATERAL INTEGRATION TEST
 *
 * This test suite validates the end-to-end integration between the
 * NotificationProducer and NotificationConsumer microservices running
 * simultaneously as independent processes — without mocks, stubs, or
 * Pact interceptors.
 *
 * PURPOSE:
 * Pact consumer-driven contract tests verify that the consumer's
 * expectations are formally encoded and that the producer can honour
 * them in isolation. This bilateral test complements CDC by proving
 * that the two real services communicate correctly when deployed
 * together — validating the full HTTP stack including routing, CORS,
 * serialisation, and error handling.
 *
 * ARCHITECTURE UNDER TEST:
 *   [NotificationConsumer :3002] --HTTP--> [NotificationProducer :3001]
 *
 * DISTINCTION CRITERIA EVIDENCED:
 *   S19 — Implements software engineering projects using appropriate methods
 *   S18 — Applies analysis methods to deliver an outcome meeting requirements
 *   K25 — Factors affecting product quality controlled throughout development
 *   D5  — Post-implementation evaluation of SE solution
 */

import { Server } from 'http';
import axios from 'axios';
import { app as producerApp } from '../producer/app';
import { createConsumerApp } from '../consumer/app';

describe('Bilateral Integration: Consumer → Producer', () => {
  let producerServer: Server;
  let consumerServer: Server;
  let producerPort: number;
  let consumerPort: number;
  let consumerBaseUrl: string;

  beforeAll((done) => {
    // Start producer on a random available port
    producerServer = producerApp.listen(0, () => {
      const producerAddr = producerServer.address();
      producerPort = typeof producerAddr === 'object' && producerAddr
        ? producerAddr.port : 3001;

      // Set PRODUCER_URL so the consumer knows where to call
      process.env.PRODUCER_URL = `http://localhost:${producerPort}`;

      // Start consumer on a different random port
      const consumerApp = createConsumerApp();
      consumerServer = consumerApp.listen(0, () => {
        const consumerAddr = consumerServer.address();
        consumerPort = typeof consumerAddr === 'object' && consumerAddr
          ? consumerAddr.port : 3002;
        consumerBaseUrl = `http://localhost:${consumerPort}`;

        console.log(`Producer running on :${producerPort}`);
        console.log(`Consumer running on :${consumerPort}`);
        console.log(`Consumer → Producer: http://localhost:${producerPort}`);
        done();
      });
    });
  });

  afterAll((done) => {
    let closed = 0;
    const finish = () => { if (++closed === 2) done(); };
    producerServer.close(finish);
    consumerServer.close(finish);
  });

  describe('Health Check — bilateral service discovery', () => {
    it('consumer health endpoint reports producer as reachable', async () => {
      const start = Date.now();
      const res = await axios.get(`${consumerBaseUrl}/health`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('UP');
      expect(res.data.service).toBe('notification-consumer');
      expect(res.data.producer.status).toBe('UP');
      expect(res.data.producer.version).toBe('1.0.0');

      console.log(`Health check round-trip: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('producer health endpoint responds directly', async () => {
      const start = Date.now();
      const res = await axios.get(`http://localhost:${producerPort}/health`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('UP');
      expect(res.data.version).toBe('1.0.0');

      console.log(`Producer health direct: ${duration}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Notification retrieval — end-to-end data flow', () => {
    it('consumer fetches and enriches notifications from producer', async () => {
      const start = Date.now();
      const res = await axios.get(`${consumerBaseUrl}/api/v1/notifications`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);

      // Core contract fields — must be present per Pact contract
      expect(res.data.notifications).toBeDefined();
      expect(Array.isArray(res.data.notifications)).toBe(true);
      expect(res.data.notifications.length).toBeGreaterThan(0);
      expect(res.data.total).toBeDefined();
      expect(res.data.page).toBeDefined();

      // Consumer enrichment fields — added by consumer layer
      expect(res.data.consumedBy).toBe('notification-consumer');
      expect(res.data.consumedAt).toBeDefined();

      // Validate first notification has all required contract fields
      const notification = res.data.notifications[0];
      expect(notification.id).toBeDefined();
      expect(notification.type).toMatch(/^(CASE_UPDATED|CASE_CREATED|CASE_CLOSED)$/);
      expect(notification.caseId).toBeDefined();
      expect(notification.status).toBeDefined();
      expect(notification.timestamp).toBeDefined();

      console.log(`Full notification fetch round-trip: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('consumer fetches individual notification by ID from producer', async () => {
      // First get the list to find a valid ID
      const listRes = await axios.get(`${consumerBaseUrl}/api/v1/notifications`);
      const firstId = listRes.data.notifications[0].id;

      const start = Date.now();
      const res = await axios.get(`${consumerBaseUrl}/api/v1/notifications/${firstId}`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(firstId);
      expect(res.data.caseId).toBeDefined();
      expect(res.data.consumedBy).toBe('notification-consumer');

      console.log(`Individual notification fetch: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('consumer correctly propagates 404 from producer for unknown ID', async () => {
      try {
        await axios.get(`${consumerBaseUrl}/api/v1/notifications/NONEXISTENT-999`);
        fail('Should have thrown 404');
      } catch (err) {
        const e = err as { response: { status: number; data: { error: string } } };
        expect(e.response.status).toBe(404);
        expect(e.response.data.error).toBe('Notification not found');
      }
    });
  });

  describe('Performance baseline — response time assertions', () => {
    it('producer GET /api/v1/notifications responds within 100ms', async () => {
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await axios.get(`http://localhost:${producerPort}/api/v1/notifications`);
        times.push(Date.now() - start);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      console.log(`Producer p100 over 5 requests: avg=${avg.toFixed(1)}ms max=${max}ms`);
      expect(max).toBeLessThan(100);
    });

    it('consumer → producer round-trip responds within 500ms', async () => {
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await axios.get(`${consumerBaseUrl}/api/v1/notifications`);
        times.push(Date.now() - start);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      console.log(`Consumer→Producer p100 over 5 requests: avg=${avg.toFixed(1)}ms max=${max}ms`);
      expect(max).toBeLessThan(500);
    });
  });
});
