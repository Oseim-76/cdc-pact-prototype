import path from 'path';
import { Verifier } from '@pact-foundation/pact';
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
    const verifierOptions: any = {
      provider: 'NotificationProducer',
      providerBaseUrl: `http://localhost:${port}`,
      stateHandlers: {
        'notifications exist': async () => {},
        'notification notif-001 exists': async () => {},
        'notification notif-999 does not exist': async () => {},
        'producer is running': async () => {},
      },
      logLevel: 'warn',
    };

    if (USE_BROKER) {
      verifierOptions.pactBrokerUrl = PACT_BROKER_URL;
      verifierOptions.consumerVersionSelectors = [{ tag: 'main', latest: true }];
      verifierOptions.publishVerificationResult = true;
      verifierOptions.providerVersion = '1.0.0';
      verifierOptions.providerVersionTags = ['main'];
    } else {
      verifierOptions.pactUrls = [
        path.resolve(process.cwd(), 'pacts', 'NotificationConsumer-NotificationProducer.json'),
      ];
    }

    const verifier = new Verifier(verifierOptions);
    await verifier.verifyProvider();
  }, 30000);
});
