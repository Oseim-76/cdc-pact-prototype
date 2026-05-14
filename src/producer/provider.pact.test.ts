import { Verifier } from '@pact-foundation/pact';
import { app } from './app';
import { Server } from 'http';

const PACT_BROKER_URL = process.env.PACT_BROKER_URL || 'http://localhost:9292';

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

  it('should validate the expectations of NotificationConsumer from Pact Broker', async () => {
    const verifier = new Verifier({
      provider: 'NotificationProducer',
      providerBaseUrl: `http://localhost:${port}`,
      pactBrokerUrl: PACT_BROKER_URL,
      consumerVersionSelectors: [
        { tag: 'main', latest: true }
      ],
      publishVerificationResult: true,
      providerVersion: '1.0.0',
      providerVersionTags: ['main'],
      stateHandlers: {
        'notifications exist': async () => {},
        'notification notif-001 exists': async () => {},
        'notification notif-999 does not exist': async () => {},
        'producer is running': async () => {},
      },
      logLevel: 'warn',
    });

    await verifier.verifyProvider();
  }, 30000);
});
