import express, { Application, Request, Response } from 'express';

// BREAKING CHANGE VERSION - simulates a developer removing the 'caseId' field
// and renaming 'status' to 'state' without consumer agreement.
// This represents the interface drift problem CDC is designed to catch.

const app: Application = express();
app.use(express.json());

// Broken notification structure - fields renamed/removed without consumer agreement
const brokenNotifications = [
  {
    id: 'notif-001',
    type: 'CASE_UPDATED',
    // caseId REMOVED - breaking change
    state: 'IN_PROGRESS', // renamed from 'status' - breaking change
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      source: 'dynamics-365',
      version: '2.0.0', // version bumped but contract not updated
    },
  },
];

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/notifications', (_req: Request, res: Response) => {
  res.status(200).json({
    notifications: brokenNotifications,
    total: brokenNotifications.length,
    page: 1,
  });
});

app.get('/api/v1/notifications/:id', (req: Request, res: Response) => {
  const notification = brokenNotifications.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.status(200).json(notification);
});

export { app };
