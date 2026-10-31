'use server';

import type { GetAllServicesResponse, CreateServiceResponse, UpdateServiceResponse } from '@/types/api-responses/data-management';

import { backendPost } from '@/lib/api/backend-server';

import { CreateRoleInput, UpdateRoleInput, CreateCourseInput, UpdateCourseInput, CreateBranchInput, UpdateBranchInput, CreateEnquirySourceInput, UpdateEnquirySourceInput, DeleteInput, CreateServiceInput, UpdateServiceInput, CreateRequiredServiceInput, UpdateRequiredServiceInput } from "@/types/data-management";

interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export async function getAllRoles(): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/getAllRoles', {  });
}

export async function createRole(input: CreateRoleInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/createRole', { input });
}

export async function updateRole(input: UpdateRoleInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/updateRole', { input });
}

export async function deleteRole(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/deleteRole', { input });
}

export async function getAllCourses(): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/getAllCourses', {  });
}

export async function createCourse(input: CreateCourseInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/createCourse', { input });
}

export async function updateCourse(input: UpdateCourseInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/updateCourse', { input });
}

export async function deleteCourse(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/deleteCourse', { input });
}

export async function toggleCourseStatus(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/toggleCourseStatus', { input });
}

export async function getAllBranches(): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/getAllBranches', {  });
}

export async function createBranch(input: CreateBranchInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/createBranch', { input });
}

export async function updateBranch(input: UpdateBranchInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/updateBranch', { input });
}

export async function deleteBranch(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/deleteBranch', { input });
}

export async function toggleBranchStatus(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/toggleBranchStatus', { input });
}

export async function getAllEnquirySources(): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/getAllEnquirySources', {  });
}

export async function createEnquirySource(input: CreateEnquirySourceInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/createEnquirySource', { input });
}

export async function updateEnquirySource(input: UpdateEnquirySourceInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/updateEnquirySource', { input });
}

export async function deleteEnquirySource(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/deleteEnquirySource', { input });
}

export async function toggleEnquirySourceStatus(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/toggleEnquirySourceStatus', { input });
}

export async function getAllRequiredServices(): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/getAllRequiredServices', {  });
}

export async function getAllServices(): Promise<GetAllServicesResponse> {
  return backendPost<GetAllServicesResponse>('/workflows/data-management/getAllServices', {  });
}

export async function createService(input: CreateServiceInput): Promise<CreateServiceResponse> {
  return backendPost<CreateServiceResponse>('/workflows/data-management/createService', { input });
}

export async function updateService(input: UpdateServiceInput): Promise<UpdateServiceResponse> {
  return backendPost<UpdateServiceResponse>('/workflows/data-management/updateService', { input });
}

export async function deleteService(input: DeleteInput): Promise<{ success: boolean; message: string; }> {
  return backendPost<{ success: boolean; message: string; }>('/workflows/data-management/deleteService', { input });
}

export async function createRequiredService(input: CreateRequiredServiceInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/createRequiredService', { input });
}

export async function updateRequiredService(input: UpdateRequiredServiceInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/updateRequiredService', { input });
}

export async function deleteRequiredService(input: DeleteInput): Promise<ActionResponse> {
  return backendPost<ActionResponse<unknown>>('/workflows/data-management/deleteRequiredService', { input });
}
