import type { NotificationType } from '@/types/api-models';
import type * as ApiModels from '@/types/api-models';

export type GetNotificationsResponse = { success: boolean; message: string; data?: undefined; unreadCount?: undefined; } | { success: boolean; data: { id: string; createdAt: Date; updatedAt: Date; message: string; type: ApiModels.NotificationType; link: string | null; userId: string; title: string; isRead: boolean; }[]; unreadCount: number; message?: undefined; };
