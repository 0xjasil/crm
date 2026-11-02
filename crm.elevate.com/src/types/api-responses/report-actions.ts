import type { ReportDashboardData } from '@/types/reports';

export type GetReportDashboardDataResponse = ReportDashboardData | { summaryCards: ({ title: string; value: number; trend: { value: string; type: string; }; icon: string; color: string; } | { title: string; value: string; trend: { value: string; type: string; }; icon: string; color: string; })[]; availableReports: never[]; recentActivity: never[]; };
