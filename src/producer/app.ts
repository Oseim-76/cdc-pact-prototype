import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Notification, NotificationResponse, HealthResponse } from '../shared/types';

const app: Application = express();
app.use(cors());
app.use(express.json());

const notifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'CASE_UPDATED',
    caseId: 'DFT-2024-001',
    status: 'IN_PROGRESS',
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      source: 'dynamics-365',
      version: '1.0.0',
    },
  },
  {
    id: 'notif-002',
    type: 'CASE_CREATED',
    caseId: 'DFT-2024-002',
    status: 'OPEN',
    timestamp: '2024-01-15T11:00:00Z',
    metadata: {
      source: 'dynamics-365',
      version: '1.0.0',
    },
  },
];

app.get('/health', (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'UP',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

app.get('/api/v1/notifications', (req: Request, res: Response) => {
  const { status, source, type } = req.query;

  let filtered = notifications;

  if (status && typeof status === 'string') {
    filtered = filtered.filter((n) => n.status === status);
  }
  if (source && typeof source === 'string') {
    filtered = filtered.filter((n) => n.metadata.source === source);
  }
  if (type && typeof type === 'string') {
    filtered = filtered.filter((n) => n.type === type);
  }

  const response: NotificationResponse = {
    notifications: filtered,
    total: filtered.length,
    page: 1,
  };
  res.status(200).json(response);
});

app.get('/api/v1/notifications/:id', (req: Request, res: Response) => {
  const notification = notifications.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.status(200).json(notification);
});

export { app };
