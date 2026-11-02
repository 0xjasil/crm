'use server';

import { backendPost } from '@/lib/api/backend-server';

import { authActionClient } from '@/lib/safe-action';

import { createExpenseSchema, updateExpenseSchema, deleteExpenseSchema, getExpenseSchema, getExpensesSchema, duplicateExpenseSchema } from '@/schema/expense-schema';

import type { ExpenseWithRelations } from '@/types/expense';

export const createExpenseAction = authActionClient
  .inputSchema(createExpenseSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations; message: string; }>('/workflows/expense-actions/createExpenseAction', { input: parsedInput ?? {} });
  });

export const updateExpenseAction = authActionClient
  .inputSchema(updateExpenseSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations; message: string; }>('/workflows/expense-actions/updateExpenseAction', { input: parsedInput ?? {} });
  });

export const deleteExpenseAction = authActionClient
  .inputSchema(deleteExpenseSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/expense-actions/deleteExpenseAction', { input: parsedInput ?? {} });
  });

export const getExpensesAction = authActionClient
  .inputSchema(getExpensesSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations[]; total: number; message: string; }>('/workflows/expense-actions/getExpensesAction', { input: parsedInput ?? {} });
  });

export const getExpenseByIdAction = authActionClient
  .inputSchema(getExpenseSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations; message: string; }>('/workflows/expense-actions/getExpenseByIdAction', { input: parsedInput ?? {} });
  });

export const getExpensesByUserAction = authActionClient
  .inputSchema(getExpensesSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations[]; total: number; message: string; }>('/workflows/expense-actions/getExpensesByUserAction', { input: parsedInput ?? {} });
  });

export const getExpensesByDateRangeAction = authActionClient
  .inputSchema(getExpensesSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations[]; message: string; }>('/workflows/expense-actions/getExpensesByDateRangeAction', { input: parsedInput ?? {} });
  });

export const getExpensesByCategoryAction = authActionClient
  .inputSchema(getExpensesSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations[]; message: string; }>('/workflows/expense-actions/getExpensesByCategoryAction', { input: parsedInput ?? {} });
  });

export const duplicateExpenseAction = authActionClient
  .inputSchema(duplicateExpenseSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: ExpenseWithRelations; message: string; }>('/workflows/expense-actions/duplicateExpenseAction', { input: parsedInput ?? {} });
  });
