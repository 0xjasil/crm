'use server';

import { backendPost } from '@/lib/api/backend-server';

import { CreateCallLogInput, CallLogFilters } from '@/types/enquiry';

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

export async function createCallLog(data: CreateCallLogInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/call-log/createCallLog', { data });
}

const CALL_LOG_SORT_FIELDS = ['callDate', 'createdAt', 'duration'];

export async function getCallLogs(filters: CallLogFilters = {}): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/call-log/getCallLogs', { filters });
}

export async function deleteCallLog(id: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/call-log/deleteCallLog', { id });
}
