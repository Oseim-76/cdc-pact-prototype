import axios, { AxiosInstance } from 'axios';
import { Notification, NotificationResponse, HealthResponse } from '../shared/types';

export class NotificationClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { Accept: 'application/json' },
      timeout: 5000,
    });
  }

  async getHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async getNotifications(): Promise<NotificationResponse> {
    const response = await this.client.get<NotificationResponse>('/api/v1/notifications');
    return response.data;
  }

  async getNotificationById(id: string): Promise<Notification> {
    const response = await this.client.get<Notification>(`/api/v1/notifications/${id}`);
    return response.data;
  }
}
