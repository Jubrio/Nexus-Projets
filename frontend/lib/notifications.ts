import { api } from './api';

export interface AppNotification {
  id: string;
  data: {
    type: string;
    message: string;
    ticket_id?: number;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export async function getNotifications(): Promise<NotificationsResponse> {
  const response = await api.get<NotificationsResponse>('/notifications');
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}
