'use server';

import type { GetNotificationsResponse } from '@/types/api-responses/notification';

import { backendPost } from '@/lib/api/backend-server';

export async function getNotifications(): Promise<GetNotificationsResponse> {
  return backendPost<GetNotificationsResponse>('/workflows/notification/getNotifications', {  });
}

export async function markAsRead(id: string): Promise<{ success: boolean; message: string; }> {
  return backendPost<{ success: boolean; message: string; }>('/workflows/notification/markAsRead', { id });
}

export async function markAllAsRead(): Promise<{ success: boolean; message: string; }> {
  return backendPost<{ success: boolean; message: string; }>('/workflows/notification/markAllAsRead', {  });
}
