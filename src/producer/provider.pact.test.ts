import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { app } from './app';
import { Server } from 'http';

describe('Pact Provider Verification', () => {
  let server: Server;
  let port: number;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 3001;
      console.log(`Provider test server running on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should validate the expectations of the NotificationConsumer', async () => {
    const verifier = new Verifier({
      provider: 'NotificationProducer',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(
          process.cwd(),
          'pacts',
          'NotificationConsumer-NotificationProducer.json'
        ),
      ],
      stateHandlers: {
        'notifications exist': async () => {
          // Default state - notifications already seeded in app.ts
        },
        'notification notif-001 exists': async () => {
          // Default state - notif-001 already seeded in app.ts
        },
        'notification notif-999 does not exist': async () => {
          // Default state - notif-999 not in seed data
        },
        'producer is running': async () => {
          // Default state - server is running
        },
      },
      logLevel: 'warn',
    });

    await verifier.verifyProvider();
  }, 30000);
});
