'use server';

import type { GetBranchesResponse, GetCoursesResponse } from '@/types/api-responses/enquiry-action';

import { backendPost } from '@/lib/api/backend-server';

import { createSafeActionClient } from 'next-safe-action';

import { z } from 'zod';

const action = createSafeActionClient();

export const getBranches = action.schema(z.object({})).action(async ({ parsedInput }) => {
    return backendPost<GetBranchesResponse>('/workflows/enquiry-action/getBranches', { input: parsedInput ?? {} });
  });

export const getCourses = action.schema(z.object({})).action(async ({ parsedInput }) => {
    return backendPost<GetCoursesResponse>('/workflows/enquiry-action/getCourses', { input: parsedInput ?? {} });
  });

export const getEnquirySources = action.schema(z.object({})).action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; }[]; }>('/workflows/enquiry-action/getEnquirySources', { input: parsedInput ?? {} });
  });

export const getRequiredServices = action.schema(z.object({})).action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; price: number; }[]; }>('/workflows/enquiry-action/getRequiredServices', { input: parsedInput ?? {} });
  });

export const getUsers = action.schema(z.object({ branchId: z.string().optional() })).action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: { name: string; id: string; role: string | null; branch: string | null; }[]; }>('/workflows/enquiry-action/getUsers', { input: parsedInput ?? {} });
  });
