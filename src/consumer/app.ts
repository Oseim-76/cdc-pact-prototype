import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { NotificationClient } from './notification.client';

const PRODUCER_URL = process.env.PRODUCER_URL ?? 'http://localhost:3001';

export function createConsumerApp(): Application {
  const app = express();
  const client = new NotificationClient(PRODUCER_URL);

  app.use(cors());
  app.use(express.json());

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const producerHealth = await client.getHealth();
      res.status(200).json({
        status: 'UP',
        version: '1.0.0',
        service: 'notification-consumer',
        producer: {
          url: PRODUCER_URL,
          status: producerHealth.status,
          version: producerHealth.version,
        },
      });
    } catch {
      res.status(200).json({
        status: 'UP',
        version: '1.0.0',
        service: 'notification-consumer',
        producer: { url: PRODUCER_URL, status: 'UNREACHABLE' },
      });
    }
  });

  app.get('/api/v1/notifications', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await client.getNotifications();
      res.status(200).json({
        ...data,
        consumedBy: 'notification-consumer',
        consumedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/v1/notifications/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const notification = await client.getNotificationById(id);
      res.status(200).json({
        ...notification,
        consumedBy: 'notification-consumer',
        consumedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }
      next(err);
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Consumer error:', err.message);
    res.status(500).json({ error: 'Internal consumer error', message: err.message });
  });

  return app;
}
