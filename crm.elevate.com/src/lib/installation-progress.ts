import { z } from 'zod';

export const installationProgressSchema = z.object({
  id: z.string().min(1),
  stage: z.enum([
    'SURVEY_COMPLETED', 'DOCUMENTS_VERIFIED', 'MATERIAL_DISPATCHED',
    'INSTALLATION_IN_PROGRESS', 'INSTALLED',
  ]),
}).strict();

type ProgressUser = { id: string; role?: string | null };

// Admins and all field operations staff may update any project's progress.
export function installationProgressScope(user: ProgressUser): Record<string, never> | null {
  if (user.role === 'admin') return {};
  if (!['job_orders', 'joborders'].includes(user.role || '')) return null;
  return {};
}

export function installationProgressData(stage: z.infer<typeof installationProgressSchema>['stage'], existingNotes: string | null) {
  let notes: Record<string, unknown> = {};
  if (existingNotes) {
    try {
      const parsed: unknown = JSON.parse(existingNotes);
      notes = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown> : { notes: existingNotes };
    } catch {
      notes = { notes: existingNotes };
    }
  }
  const status = stage === 'INSTALLED' ? 'COMPLETED' as const
    : stage === 'MATERIAL_DISPATCHED' || stage === 'INSTALLATION_IN_PROGRESS'
      ? 'CONFIRMED' as const : 'PENDING' as const;
  const now = new Date().toISOString();
  return {
    status,
    additionalNotes: JSON.stringify({
      ...notes,
      timelineStep: stage,
      timelineUpdatedAt: now,
      ...(stage === 'INSTALLED' ? { installedAt: now } : {}),
    }),
  };
}
