import 'server-only';
import { z } from 'zod';
import { resolveBackendUrl } from '@/lib/api/backend-url';

const apiUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'API_URL must use HTTP or HTTPS');

export const env = {
  get API_URL(): string {
    // Resolve lazily so builds can run before deployment variables exist.
    const apiUrl = resolveBackendUrl({
      apiUrl: process.env.API_URL,
      internalUrl: process.env.BACKEND_INTERNAL_URL,
      publicUrl: process.env.NEXT_PUBLIC_API_URL,
    });
    return apiUrlSchema.parse(apiUrl);
  },
};
