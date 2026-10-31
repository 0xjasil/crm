'use server';

import type { GetCurrentUserResponse, CreateAdmissionResponse, UpdateAdmissionResponse, GetAdmissionsResponse, GetAdmissionByIdResponse, GetAdmissionsByEnquiryResponse, GetCoursesForAdmissionResponse } from '@/types/api-responses/admission-actions';

import { backendPost } from '@/lib/api/backend-server';

import { z } from "zod";

import { actionClient, adminActionClient, authActionClient } from "@/lib/safe-action";

import { installationProgressSchema } from "@/lib/installation-progress";

import { AdmissionGender, AdmissionStatus } from "@/types/admission";

export async function getCurrentUser(): Promise<GetCurrentUserResponse> {
  return backendPost<GetCurrentUserResponse>('/workflows/admission-actions/getCurrentUser', {  });
}

const agentRoles = ["manager", "admin","counsellor"];

const createAdmissionSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.nativeEnum(AdmissionGender).optional(),
  dateOfBirth: z.date().optional(),
  address: z.string().min(1, "Address is required"),
  leadSource: z.string().optional(),
  lastQualification: z.string().optional(),
  yearOfPassing: z.number().min(1950).max(new Date().getFullYear()).optional(),
  percentageCGPA: z.string().optional(),
  instituteName: z.string().optional(),
  additionalNotes: z.string().optional(),
  courseId: z.string().min(1, "Course selection is required"),
  agentName: z.string().optional(),
  agentCommission: z.number().min(0).optional(),
  enquiryId: z.string().optional(),
  createdAt : z.date().optional()
});

const updateAdmissionSchema = z.object({
  id: z.string().min(1, "Admission ID is required"),
  candidateName: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.nativeEnum(AdmissionGender).optional(),
  dateOfBirth: z.date().optional(),
  address: z.string().optional(),
  agentName: z.string().optional(),
  agentCommission: z.number().min(0).optional(),
  leadSource: z.string().optional(),
  lastQualification: z.string().optional(),
  yearOfPassing: z.number().min(1950).max(new Date().getFullYear()).optional(),
  percentageCGPA: z.string().optional(),
  instituteName: z.string().optional(),
  additionalNotes: z.string().optional(),
  courseId: z.string().optional(),
  createdAt : z.date().optional(),
  status: z.nativeEnum(AdmissionStatus).optional(),
  enquiryId: z.string().optional(),
});

const deleteAdmissionSchema = z.object({
  id: z.string().min(1, "Admission ID is required"),
});

const getAdmissionsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(AdmissionStatus).optional(),
  branchId: z.string().optional(),
  courseId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

const getAdmissionByIdSchema = z.object({
  id: z.string().min(1, "Admission ID is required"),
});

const getAdmissionsByEnquirySchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID is required"),
});

export const createAdmission = actionClient
  .schema(createAdmissionSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<CreateAdmissionResponse>('/workflows/admission-actions/createAdmission', { input: parsedInput ?? {} });
  });

export const updateInstallationProgress = authActionClient
  .schema(installationProgressSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/admission-actions/updateInstallationProgress', { input: parsedInput ?? {} });
  });

export const updateAdmission = adminActionClient
  .schema(updateAdmissionSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<UpdateAdmissionResponse>('/workflows/admission-actions/updateAdmission', { input: parsedInput ?? {} });
  });

export const deleteAdmission = adminActionClient
  .schema(deleteAdmissionSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/admission-actions/deleteAdmission', { input: parsedInput ?? {} });
  });

const ADMISSION_SORT_FIELDS = [
  "createdAt",
  "candidateName",
  "admissionNumber",
  "status",
  "balance",
  "updatedAt",
];

export const getAdmissions = actionClient
  .schema(getAdmissionsSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<GetAdmissionsResponse>('/workflows/admission-actions/getAdmissions', { input: parsedInput ?? {} });
  });

export const getAdmissionById = actionClient
  .schema(getAdmissionByIdSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<GetAdmissionByIdResponse>('/workflows/admission-actions/getAdmissionById', { input: parsedInput ?? {} });
  });

export const getAdmissionsByEnquiry = actionClient
  .schema(getAdmissionsByEnquirySchema)
  .action(async ({ parsedInput }) => {
    return backendPost<GetAdmissionsByEnquiryResponse>('/workflows/admission-actions/getAdmissionsByEnquiry', { input: parsedInput ?? {} });
  });

export const getEnquirySourcesForAdmission = actionClient.action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; }[]; }>('/workflows/admission-actions/getEnquirySourcesForAdmission', { input: parsedInput ?? {} });
  });

export const getCoursesForAdmission = actionClient.action(async ({ parsedInput }) => {
    return backendPost<GetCoursesForAdmissionResponse>('/workflows/admission-actions/getCoursesForAdmission', { input: parsedInput ?? {} });
  });
