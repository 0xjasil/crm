import type { Prisma } from '@prisma/client';
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
export function installationProgressScope(user: ProgressUser): Prisma.AdmissionWhereInput | null {
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

export async function saveInstallationProgress(
  tx: Pick<Prisma.TransactionClient, 'admission'>,
  user: ProgressUser,
  input: z.infer<typeof installationProgressSchema>,
) {
  const { id, stage } = installationProgressSchema.parse(input ?? {});
  const scope = installationProgressScope(user);
  if (!scope) throw new Error('Insufficient permissions');
  const where = { id, ...scope };
  const project = await tx.admission.findFirst({ where, select: { additionalNotes: true } });
  if (!project) throw new Error('Project not found');
  const result = await tx.admission.updateMany({
    where,
    data: installationProgressData(stage, project.additionalNotes),
  });
  if (result.count !== 1) throw new Error('Project not found');
}
