import { z } from 'zod';
import type { ApiErrorBody } from '@/lib/api/types';

const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
const legacyErrorSchema = z.object({ message: z.string() });
const legacyNestedErrorSchema = z.object({ error: legacyErrorSchema });

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function parseApiError(body: unknown, statusCode: number): ApiError {
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    const { error }: ApiErrorBody = parsed.data;
    return new ApiError(error.message, statusCode, error.code);
  }

  const nested = legacyNestedErrorSchema.safeParse(body);
  if (nested.success) {
    return new ApiError(nested.data.error.message, statusCode);
  }

  // Older workflow endpoints still return a top-level message.
  const legacy = legacyErrorSchema.safeParse(body);
  const message = legacy.success ? legacy.data.message : `API request failed (${statusCode})`;
  return new ApiError(message, statusCode);
}
