'use server';

import { backendPost } from '@/lib/api/backend-server';

import { CreateFollowUpInput, UpdateFollowUpInput, FollowUpFilters } from '@/types/enquiry';

interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function createFollowUp(data: CreateFollowUpInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/follow-up/createFollowUp', { data });
}

const FOLLOW_UP_SORT_FIELDS = ['scheduledAt', 'createdAt', 'status'];

export async function getFollowUps(filters: FollowUpFilters = {}): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/follow-up/getFollowUps', { filters });
}

export async function updateFollowUp(data: UpdateFollowUpInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/follow-up/updateFollowUp', { data });
}

export async function deleteFollowUp(id: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/follow-up/deleteFollowUp', { id });
}
