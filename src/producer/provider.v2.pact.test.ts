import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { app } from './app.v2';
import { Server } from 'http';

// This test demonstrates that v2 of the Producer API maintains
// full backward compatibility with v1 consumer contracts.
// Additive changes (new optional fields) do NOT break existing consumers.

describe('Pact Provider V2 Verification - Backward Compatibility', () => {
  let server: Server;
  let port: number;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 3003;
      console.log(`V2 Provider test server running on port ${port}`);
      console.log('Testing backward compatibility: v1 contracts must pass against v2 producer');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should maintain backward compatibility - v1 contracts pass against v2 producer', async () => {
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
        'notifications exist': async () => {},
        'notification notif-001 exists': async () => {},
        'notification notif-999 does not exist': async () => {},
        'producer is running': async () => {},
      },
      logLevel: 'warn',
    });

    await verifier.verifyProvider();
    console.log('BACKWARD COMPATIBILITY CONFIRMED: All v1 contracts pass against v2 producer');
    console.log('Additive changes (priority, assignee, tags) do not break existing consumers');
  }, 30000);
});
