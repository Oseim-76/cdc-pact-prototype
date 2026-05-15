import path from 'path';
import { Verifier, VerifierOptions } from '@pact-foundation/pact';
import { app } from './app';
import { Server } from 'http';

const PACT_BROKER_URL = process.env.PACT_BROKER_URL || '';
const USE_BROKER = PACT_BROKER_URL !== '';

describe('Pact Provider Verification', () => {
  let server: Server;
  let port: number;

  beforeAll((done) => {
    server = app.listen(0, () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 3001;
      console.log(`Provider test server running on port ${port}`);
      console.log(`Verification mode: ${USE_BROKER ? 'Pact Broker' : 'Local pact files'}`);
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should validate the expectations of NotificationConsumer', async () => {
    const baseOptions: VerifierOptions = {
      provider: 'NotificationProducer',
      providerBaseUrl: `http://localhost:${port}`,
      stateHandlers: {
        'notifications exist': async () => { return; },
        'notification notif-001 exists': async () => { return; },
        'notification notif-999 does not exist': async () => { return; },
        'producer is running': async () => { return; },
      },
      logLevel: 'warn',
    };

    const verifierOptions: VerifierOptions = USE_BROKER
      ? {
          ...baseOptions,
          pactBrokerUrl: PACT_BROKER_URL,
          consumerVersionSelectors: [{ tag: 'main', latest: true }],
          publishVerificationResult: true,
          providerVersion: '1.0.0',
          providerVersionTags: ['main'],
        }
      : {
          ...baseOptions,
          pactUrls: [
            path.resolve(process.cwd(), 'pacts', 'NotificationConsumer-NotificationProducer.json'),
          ],
        };

    const verifier = new Verifier(verifierOptions);
    await verifier.verifyProvider();
  }, 30000);
});
