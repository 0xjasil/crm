'use server';

import type { GetCurrentUserResponse } from '@/types/api-responses/enquiry';

import { backendPost } from '@/lib/api/backend-server';

import { EnquiryStatus } from '@/types/enquiry';

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

export async function getCurrentUser(): Promise<GetCurrentUserResponse> {
  return backendPost<GetCurrentUserResponse>('/workflows/enquiry/getCurrentUser', {  });
}

export async function getEnquiryFollowUps(enquiryId: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/getEnquiryFollowUps', { enquiryId });
}

export async function getEnquiryCallLogs(enquiryId: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/getEnquiryCallLogs', { enquiryId });
}

export async function getEnquiryJobLeads(enquiryId: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/getEnquiryJobLeads', { enquiryId });
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/updateEnquiryStatus', { id, status });
}

export async function updateEnquiryStatusWithActivity(id: string, newStatus: EnquiryStatus, statusRemarks?: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/updateEnquiryStatusWithActivity', { id, newStatus, statusRemarks });
}

export async function updateEnquiryStatusDirectToEnrolled(id: string, statusRemarks?: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/updateEnquiryStatusDirectToEnrolled', { id, statusRemarks });
}

export async function assignEnquiry(id: string, assignedToUserId: string, startDate: Date, endDate: Date, branchId: string, name: string, description?: string | null, remarks?: string | null): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/enquiries/' + encodeURIComponent(id) + '/assign', { assignedToUserId, startDate, endDate, branchId, name, description, remarks });
}

export async function bulkAssignEnquiries(ids: string[], assignedToUserId: string, startDate: Date, endDate: Date, branchId: string, name: string, description?: string | null, remarks?: string | null): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/enquiries/bulk-assign', { enquiryIds: ids, assignedToUserId, startDate, endDate, branchId, name, description, remarks });
}

export async function bulkImportEnquiries(leads: any[], commonFields: { branchId: string; enquirySourceId?: string }): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/bulkImportEnquiries', { leads, commonFields });
}

export async function getUsers(branchId?: string): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/enquiry/getUsers', { branchId });
}
