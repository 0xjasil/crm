'use server';

import type { ListStudentsResponse, GetServiceBillByIdResponse, GetServicesByIdsResponse, GetAdmissionHistoryByIdResponse, GetServiceBillDetailsForPDFResponse } from '@/types/api-responses/service-actions';

import { backendPost } from '@/lib/api/backend-server';

import { CreateServiceBilling, DeleteServiceBilling, UpdateServiceBilling, ServiceBilling, ServiceBillingWithAdmission, PayServiceBilling, ServiceBillItem } from "@/types/service-billing";

interface ActionResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

const SERVICE_BILLING_SORT_FIELDS = ['billDate', 'total', 'paid', 'balance', 'createdAt'];

export async function listServiceBilling(page = 1, pageSize = 20, searchQuery = "", sortBy: string = 'billDate', sortOrder: 'asc' | 'desc' = 'desc', serviceId = "", courseId = ""): Promise<ActionResponse<{ data: ServiceBillingWithAdmission[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>> {
  return backendPost<ActionResponse<{ data: ServiceBillingWithAdmission[]; pagination: { page: number; pageSize: number; total: number; pages: number; }; }>>('/workflows/service-actions/listServiceBilling', { page, pageSize, searchQuery, sortBy, sortOrder, serviceId, courseId });
}

export async function createServiceBilling(input: CreateServiceBilling): Promise<ActionResponse<ServiceBilling | null>> {
  return backendPost<ActionResponse<ServiceBilling | null>>('/workflows/service-actions/createServiceBilling', { input });
}

export async function updateServiceBilling(input: UpdateServiceBilling): Promise<ActionResponse<ServiceBilling | null>> {
  return backendPost<ActionResponse<ServiceBilling | null>>('/workflows/service-actions/updateServiceBilling', { input });
}

export async function getServiceBillHistory(id: string): Promise<ActionResponse<ServiceBillItem[]>> {
  return backendPost<ActionResponse<ServiceBillItem[]>>('/workflows/service-actions/getServiceBillHistory', { id });
}

export async function payServiceBilling(input: PayServiceBilling): Promise<ActionResponse<ServiceBilling | null>> {
  return backendPost<ActionResponse<ServiceBilling | null>>('/workflows/service-actions/payServiceBilling', { input });
}

export async function getServiceBillByStudentId(studentId: string): Promise<ActionResponse<ServiceBilling | null>> {
  return backendPost<ActionResponse<ServiceBilling | null>>('/workflows/service-actions/getServiceBillByStudentId', { studentId });
}

export async function deleteServiceBilling(input: DeleteServiceBilling): Promise<ActionResponse<boolean>> {
  return backendPost<ActionResponse<boolean>>('/workflows/service-actions/deleteServiceBilling', { input });
}

export async function listStudents(): Promise<ListStudentsResponse> {
  return backendPost<ListStudentsResponse>('/workflows/service-actions/listStudents', {  });
}

export async function listServices(): Promise<ActionResponse<{ id: string; name: string; price: number }[]>> {
  return backendPost<ActionResponse<{ id: string; name: string; price: number; }[]>>('/workflows/service-actions/listServices', {  });
}

export async function totalListing(): Promise<ActionResponse<{ total: number }>> {
  return backendPost<ActionResponse<{ total: number; }>>('/workflows/service-actions/totalListing', {  });
}

export async function getServiceBillById(id: string): Promise<GetServiceBillByIdResponse> {
  return backendPost<GetServiceBillByIdResponse>('/workflows/service-actions/getServiceBillById', { id });
}

export async function getServicesByIds(ids: string[]): Promise<GetServicesByIdsResponse> {
  return backendPost<GetServicesByIdsResponse>('/workflows/service-actions/getServicesByIds', { ids });
}

export async function getAdmissionHistoryById(id: string): Promise<GetAdmissionHistoryByIdResponse> {
  return backendPost<GetAdmissionHistoryByIdResponse>('/workflows/service-actions/getAdmissionHistoryById', { id });
}

export async function getServiceBillDetailsForPDF(id: string): Promise<GetServiceBillDetailsForPDFResponse> {
  return backendPost<GetServiceBillDetailsForPDFResponse>('/workflows/service-actions/getServiceBillDetailsForPDF', { id });
}
