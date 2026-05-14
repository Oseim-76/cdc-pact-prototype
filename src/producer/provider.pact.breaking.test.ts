import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { app } from './app.breaking';
import { Server } from 'http';

// This test INTENTIONALLY fails to demonstrate that CDC catches breaking changes
// before they reach production. This is the core value proposition of the approach.
// In a real CI pipeline this failure would block the merge.

describe('Pact Provider Verification - BREAKING CHANGE DEMONSTRATION', () => {
  let server: Server;
  let port: number;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 3002;
      console.log(`Breaking change server running on port ${port}`);
      console.log('NOTE: This test is expected to FAIL - demonstrating CDC catches breaking changes');
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should FAIL verification when producer introduces breaking changes', async () => {
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

    // We expect this to throw because the breaking changes violate the contract
    await expect(verifier.verifyProvider()).rejects.toThrow();
    console.log('CONTRACT VIOLATION DETECTED: CDC successfully caught the breaking change');
    console.log('In a CI pipeline, this would block the pull request from merging');
  }, 30000);
});
