import express, { Application, Request, Response } from 'express';
import cors from 'cors';

// V2 API - demonstrates ADDITIVE (non-breaking) change
// New optional fields added: priority, assignee, tags
// All v1 fields preserved - consumers requiring v1 contracts still pass

const app: Application = express();
app.use(cors());
app.use(express.json());

const notificationsV2 = [
  {
    id: 'notif-001',
    type: 'CASE_UPDATED',
    caseId: 'DFT-2024-001',
    status: 'IN_PROGRESS',
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      source: 'dynamics-365',
      version: '2.0.0',
    },
    // NEW optional fields in v2 - additive, non-breaking
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
    metadata: {
      source: 'dynamics-365',
      version: '2.0.0',
    },
    priority: 'MEDIUM',
    assignee: 'jane.doe@dft.gov.uk',
    tags: ['new-case'],
  },
];

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// V1 endpoints still supported (backward compatibility)
app.get('/api/v1/notifications', (_req: Request, res: Response) => {
  // Strip v2-only fields for v1 consumers
  const v1Notifications = notificationsV2.map(({ priority: _p, assignee: _a, tags: _t, ...v1Fields }) => v1Fields);
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
  const { priority: _priority, assignee: _assignee, tags: _tags, ...v1Fields } = notification;
  res.status(200).json(v1Fields);
});

// V2 endpoints with enriched schema
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
