'use server';

import type { GetReportDashboardDataResponse } from '@/types/api-responses/report-actions';

import { backendPost } from '@/lib/api/backend-server';

import { z } from 'zod';

import { adminActionClient, executiveActionClient, allRolesActionClient } from '@/lib/safe-action';

import { TelecallerReport, BranchReport, AdmissionPaymentReport, ExpenseReport, InvoiceReport, IncomeReport, PendingPaymentReport, CSVExportData, TelecallerEnquiryStats } from '@/types/reports';

const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
});

const reportFiltersSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  branchId: z.string().optional(),
  courseId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const getTelecallerPerformanceReport = adminActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<TelecallerReport>('/workflows/report-actions/getTelecallerPerformanceReport', { input: parsedInput ?? {} });
  });

export const getTelecallerEnquiryStats = adminActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<TelecallerEnquiryStats[]>('/workflows/report-actions/getTelecallerEnquiryStats', { input: parsedInput ?? {} });
  });

export const getTelecallerConversionRates = adminActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ telecallerId: string; telecallerName: string; totalEnquiries: number; conversions: number; conversionRate: number; }[]>('/workflows/report-actions/getTelecallerConversionRates', { input: parsedInput ?? {} });
  });

export const getBranchPerformanceReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<BranchReport>('/workflows/report-actions/getBranchPerformanceReport', { input: parsedInput ?? {} });
  });

export const getBranchAdmissionStats = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ branchId: string; branchName: string; totalAdmissions: number; totalRevenue: number; }[]>('/workflows/report-actions/getBranchAdmissionStats', { input: parsedInput ?? {} });
  });

export const getAdmissionPaymentReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<AdmissionPaymentReport>('/workflows/report-actions/getAdmissionPaymentReport', { input: parsedInput ?? {} });
  });

export const getExpenseReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<ExpenseReport>('/workflows/report-actions/getExpenseReport', { input: parsedInput ?? {} });
  });

export const getInvoiceReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<InvoiceReport>('/workflows/report-actions/getInvoiceReport', { input: parsedInput ?? {} });
  });

export const getIncomeReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<IncomeReport>('/workflows/report-actions/getIncomeReport', { input: parsedInput ?? {} });
  });

export const getPendingPaymentReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<PendingPaymentReport>('/workflows/report-actions/getPendingPaymentReport', { input: parsedInput ?? {} });
  });

export const exportTelecallerReportCSV = adminActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<CSVExportData>('/workflows/report-actions/exportTelecallerReportCSV', { input: parsedInput ?? {} });
  });

export const exportFinancialReportCSV = executiveActionClient
  .schema(
    z.object({
      reportType: z.enum(['admission-payment', 'expense', 'invoice', 'income', 'pending-payment']),
      filters: reportFiltersSchema,
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<CSVExportData>('/workflows/report-actions/exportFinancialReportCSV', { input: parsedInput ?? {} });
  });

export const getReportDashboardData = allRolesActionClient
  .schema(z.object({}))
  .action(async ({ parsedInput }) => {
    return backendPost<GetReportDashboardDataResponse>('/workflows/report-actions/getReportDashboardData', { input: parsedInput ?? {} });
  });

export const getBranchReport = executiveActionClient
  .schema(reportFiltersSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<BranchReport>('/workflows/report-actions/getBranchReport', { input: parsedInput ?? {} });
  });
