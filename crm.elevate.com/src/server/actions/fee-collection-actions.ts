'use server';

import type { CreateReceiptResponse, UpdateReceiptResponse, GetReceiptsByAdmissionIdResponse, GetAdmissionWithFeeDetailsResponse } from '@/types/api-responses/fee-collection-actions';

import { backendPost } from '@/lib/api/backend-server';

import { CreateReceiptInput, UpdateReceiptInput } from "@/types/fee-collection";

export async function createReceipt(data: CreateReceiptInput): Promise<CreateReceiptResponse> {
  return backendPost<CreateReceiptResponse>('/workflows/fee-collection-actions/createReceipt', { data });
}

export async function updateReceipt(data: UpdateReceiptInput): Promise<UpdateReceiptResponse> {
  return backendPost<UpdateReceiptResponse>('/workflows/fee-collection-actions/updateReceipt', { data });
}

export async function deleteReceipt(id: string): Promise<{ error: string; success?: undefined; } | { success: boolean; error?: undefined; }> {
  return backendPost<{ error: string; success?: undefined; } | { success: boolean; error?: undefined; }>('/workflows/fee-collection-actions/deleteReceipt', { id });
}

export async function getReceiptsByAdmissionId(admissionId: string): Promise<GetReceiptsByAdmissionIdResponse> {
  return backendPost<GetReceiptsByAdmissionIdResponse>('/workflows/fee-collection-actions/getReceiptsByAdmissionId', { admissionId });
}

export async function getAdmissionWithFeeDetails(admissionId: string): Promise<GetAdmissionWithFeeDetailsResponse> {
  return backendPost<GetAdmissionWithFeeDetailsResponse>('/workflows/fee-collection-actions/getAdmissionWithFeeDetails', { admissionId });
}
