'use server';

import type { UpdateEnquiryStatusWithActivityResponse, UpdateEnquiryStatusDirectToEnrolledResponse } from '@/types/api-responses/enquiry-status-actions';

import { backendPost } from '@/lib/api/backend-server';

import { createSafeActionClient } from 'next-safe-action';

import { z } from 'zod';

import { EnquiryStatus } from '@/types/enquiry';

const action = createSafeActionClient();

const statusUpdateSchema = z.object({
  id: z.string().min(1, 'Enquiry ID is required'),
  newStatus: z.nativeEnum(EnquiryStatus),
  statusRemarks: z.string().optional(),
});

const directEnrollmentSchema = z.object({
  id: z.string().min(1, 'Enquiry ID is required'),
  statusRemarks: z.string().optional(),
});

export const updateEnquiryStatusWithActivity = action
  .schema(statusUpdateSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<UpdateEnquiryStatusWithActivityResponse>('/workflows/enquiry-status-actions/updateEnquiryStatusWithActivity', { input: parsedInput ?? {} });
  });

export const updateEnquiryStatusDirectToEnrolled = action
  .schema(directEnrollmentSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<UpdateEnquiryStatusDirectToEnrolledResponse>('/workflows/enquiry-status-actions/updateEnquiryStatusDirectToEnrolled', { input: parsedInput ?? {} });
  });
