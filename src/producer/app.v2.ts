import express, { Application, Request, Response } from 'express';
import cors from 'cors';

// V2 API - demonstrates ADDITIVE (non-breaking) change
// New optional fields added: priority, assignee, tags
// All v1 fields preserved - consumers requiring v1 contracts still pass

const app: Application = express();
app.use(cors());
app.use(express.json());

interface NotificationV2 {
  id: string;
  type: 'CASE_UPDATED' | 'CASE_CREATED' | 'CASE_CLOSED';
  caseId: string;
  status: string;
  timestamp: string;
  metadata: { source: string; version: string };
  priority: string;
  assignee: string;
  tags: string[];
}

const notificationsV2: NotificationV2[] = [
  {
    id: 'notif-001',
    type: 'CASE_UPDATED',
    caseId: 'DFT-2024-001',
    status: 'IN_PROGRESS',
    timestamp: '2024-01-15T10:30:00Z',
    metadata: { source: 'dynamics-365', version: '2.0.0' },
    priority: 'HIGH',
    assignee: 'john.smith@dft.gov.uk',
    tags: ['urgent', 'escalated'],
  },
  {
    id: 'notif-002',
    type: 'CASE_CREATED',
    caseId: 'DFT-2024-002',
    status: 'OPEN',
    timestamp: '2024-01-15T11:00:00Z',
    metadata: { source: 'dynamics-365', version: '2.0.0' },
    priority: 'MEDIUM',
    assignee: 'jane.doe@dft.gov.uk',
    tags: ['new-case'],
  },
];

function toV1(n: NotificationV2) {
  return {
    id: n.id,
    type: n.type,
    caseId: n.caseId,
    status: n.status,
    timestamp: n.timestamp,
    metadata: n.metadata,
  };
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/notifications', (_req: Request, res: Response) => {
  const v1Notifications = notificationsV2.map(toV1);
  res.status(200).json({
    notifications: v1Notifications,
    total: v1Notifications.length,
    page: 1,
  });
});

app.get('/api/v1/notifications/:id', (req: Request, res: Response) => {
  const notification = notificationsV2.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.status(200).json(toV1(notification));
});

app.get('/api/v2/notifications', (_req: Request, res: Response) => {
  res.status(200).json({
    notifications: notificationsV2,
    total: notificationsV2.length,
    page: 1,
    version: '2.0.0',
  });
});

app.get('/api/v2/notifications/:id', (req: Request, res: Response) => {
  const notification = notificationsV2.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.status(200).json(notification);
});

export { app };
