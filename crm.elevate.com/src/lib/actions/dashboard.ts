'use server';

import { backendPost } from '@/lib/api/backend-server';

import { DashboardData } from '@/types/dashboard';

export async function getDashboardData(userId?: string, userRole?: string, userBranch?: string): Promise<DashboardData> {
  return backendPost<DashboardData>('/workflows/dashboard/getDashboardData', { userId, userRole, userBranch });
}
