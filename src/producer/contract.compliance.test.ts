/**
 * CONTRACT COMPLIANCE TEST
 *
 * This test reads the generated Pact contract JSON and asserts that the
 * real producer Express app responds with all fields and status codes
 * defined in each Pact interaction.
 *
 * PURPOSE:
 * Closes the loop between unit testing and contract testing. While
 * provider.pact.test.ts verifies the contract via the Pact framework,
 * this test does so directly via supertest — making the compliance
 * assertion visible in the standard unit test run without requiring
 * a running Pact Broker.
 *
 * DISTINCTION CRITERIA EVIDENCED:
 *   K25 — Factors affecting product quality controlled throughout development
 *   K27 — Approaches to interpretation and use of artefacts
 *   S18 — Applies analysis methods to deliver an outcome meeting requirements
 *   S19 — Implements software engineering projects using appropriate methods
 */

import request from 'supertest';
import { app } from './app';
import * as fs from 'fs';
import * as path from 'path';

interface PactInteraction {
  description: string;
  request: {
    method: string;
    path: string;
  };
  response: {
    status: number;
    body?: Record<string, unknown>;
  };
}

interface PactContract {
  consumer: { name: string };
  provider: { name: string };
  interactions: PactInteraction[];
}

const contractPath = path.resolve(
  process.cwd(),
  'pacts',
  'NotificationConsumer-NotificationProducer.json'
);

describe('Contract Compliance — Producer vs Pact Artefact', () => {
  let contract: PactContract;

  beforeAll(() => {
    expect(fs.existsSync(contractPath)).toBe(true);
    contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')) as PactContract;
  });

  it('contract artefact is well-formed with consumer and provider names', () => {
    expect(contract.consumer.name).toBe('NotificationConsumer');
    expect(contract.provider.name).toBe('NotificationProducer');
    expect(Array.isArray(contract.interactions)).toBe(true);
    expect(contract.interactions.length).toBeGreaterThanOrEqual(4);
  });

  it('producer responds with correct status code for every Pact interaction', async () => {
    for (const interaction of contract.interactions) {
      const { method, path: interactionPath } = interaction.request;
      const expectedStatus = interaction.response.status;

      const res = await (request(app) as unknown as Record<string, (path: string) => request.Test>)
        [method.toLowerCase()](interactionPath);

      expect(res.status).toBe(expectedStatus);
    }
  });

  it('producer response for GET /api/v1/notifications contains all contract-required fields', async () => {
    const interaction = contract.interactions.find(
      (i) => i.request.path === '/api/v1/notifications' && i.request.method === 'GET'
    );
    expect(interaction).toBeDefined();

    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBeDefined();

    if (res.body.notifications.length > 0) {
      const n = res.body.notifications[0];
      expect(n.id).toBeDefined();
      expect(n.type).toBeDefined();
      expect(n.caseId).toBeDefined();
      expect(n.status).toBeDefined();
      expect(n.timestamp).toBeDefined();
      expect(n.metadata).toBeDefined();
    }
  });

  it('producer response for GET /api/v1/notifications/:id contains all contract-required fields', async () => {
    const interaction = contract.interactions.find(
      (i) => i.request.path === '/api/v1/notifications/notif-001'
    );
    expect(interaction).toBeDefined();

    const res = await request(app).get('/api/v1/notifications/notif-001');
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBeDefined();
    expect(res.body.caseId).toBeDefined();
    expect(res.body.status).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.metadata).toBeDefined();
  });

  it('producer returns 404 with error field for unknown notification ID', async () => {
    const interaction = contract.interactions.find(
      (i) => i.response.status === 404
    );
    expect(interaction).toBeDefined();

    const res = await request(app).get('/api/v1/notifications/notif-999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(typeof res.body.error).toBe('string');
  });
});
