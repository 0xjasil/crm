'use server';

import { backendPost } from '@/lib/api/backend-server';

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

interface CreateJobOrderInput {
  managerId: string;
  branchId: string;
  startDate: Date;
  endDate: Date;
  enquiryIds: string[];
  name: string;
  description?: string | null;
  remarks?: string | null;
}

export async function createJobOrder(input: CreateJobOrderInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/createJobOrder', { input });
}

const JOB_ORDER_SORT_FIELDS = ['createdAt', 'startDate', 'endDate', 'name', 'jobCode'];

export async function getJobOrders(filters?: {
  managerId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pendingOnly?: boolean;
  completedOnly?: boolean;
  dueOnly?: boolean;
  search?: string;
}): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/getJobOrders', { filters });
}

export async function getJobOrder(id: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/getJobOrder', { id });
}

export async function updateJobLeadStatus(jobLeadId: string, status: 'PENDING' | 'CLOSED'): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/updateJobLeadStatus', { jobLeadId, status });
}

export async function getJobOrderStats(jobId: string): Promise<
  ActionResponse<{
    percentage: number;
    closed: number;
    total: number;
  }>
> {
  return backendPost<ActionResponse<{ percentage: number; closed: number; total: number; }>>('/workflows/job-order/getJobOrderStats', { jobId });
}

export async function deleteJobOrder(id: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/deleteJobOrder', { id });
}

export async function reassignJobOrder(id: string, newManagerId: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/reassignJobOrder', { id, newManagerId });
}

export async function getJobLead(id: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/job-order/getJobLead', { id });
}
