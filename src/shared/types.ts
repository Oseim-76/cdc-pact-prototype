export interface Notification {
  id: string;
  type: 'CASE_UPDATED' | 'CASE_CREATED' | 'CASE_CLOSED';
  caseId: string;
  status: string;
  timestamp: string;
  metadata: {
    source: string;
    version: string;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
}

export interface HealthResponse {
  status: 'UP' | 'DOWN';
  version: string;
  timestamp: string;
}
