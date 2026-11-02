'use server';

import { backendPost } from '@/lib/api/backend-server';

import { createSafeActionClient } from 'next-safe-action';

import { z } from 'zod';

import { ActivityType, type EnquiryActivity } from '@/types/enquiry-activity';

const action = createSafeActionClient();

const getActivitiesSchema = z.object({
  enquiryId: z.string().min(1, 'Enquiry ID is required'),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(50),
  type: z.array(z.nativeEnum(ActivityType)).optional(),
});

export const getEnquiryActivities = action
  .schema(getActivitiesSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: EnquiryActivity[]; pagination: { page: number; limit: number; total: number; pages: number; }; message: string; }>('/workflows/enquiry-activity-actions/getEnquiryActivities', { input: parsedInput ?? {} });
  });
