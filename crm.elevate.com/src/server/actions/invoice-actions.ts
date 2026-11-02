'use server';

import type { CreateInvoiceResponse, UpdateInvoiceResponse, GetInvoicesResponse, GetInvoiceByIdResponse, AddInvoiceItemResponse, UpdateInvoiceItemResponse } from '@/types/api-responses/invoice-actions';

import { backendPost } from '@/lib/api/backend-server';

import { createSafeActionClient } from 'next-safe-action';

import { z } from 'zod';

import { InvoiceStatus } from '@/types/invoice';

const action = createSafeActionClient();

const createInvoiceSchema = z.object({
  billedTo: z.string().min(1, 'Billed to is required'),
  invoiceDate: z.date().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1),
  taxRounding: z.string().optional(),
  serviceCharge: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
});

const updateInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  billedTo: z.string().optional(),
  invoiceDate: z.date().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  taxRounding: z.string().optional(),
  serviceCharge: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
});

const deleteInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
});

const createInvoiceItemSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  itemDescription: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const updateInvoiceItemSchema = z.object({
  id: z.string().min(1, 'Invoice item ID is required'),
  itemDescription: z.string().optional(),
  quantity: z.number().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
});

const deleteInvoiceItemSchema = z.object({
  id: z.string().min(1, 'Invoice item ID is required'),
});

const getInvoicesSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

const getInvoiceByIdSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
});

export const createInvoice = action.schema(createInvoiceSchema).action(async ({ parsedInput }) => {
    return backendPost<CreateInvoiceResponse>('/workflows/invoice-actions/createInvoice', { input: parsedInput ?? {} });
  });

export const updateInvoice = action.schema(updateInvoiceSchema).action(async ({ parsedInput }) => {
    return backendPost<UpdateInvoiceResponse>('/workflows/invoice-actions/updateInvoice', { input: parsedInput ?? {} });
  });

export const deleteInvoice = action.schema(deleteInvoiceSchema).action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/invoice-actions/deleteInvoice', { input: parsedInput ?? {} });
  });

const INVOICE_SORT_FIELDS = [
  'createdAt',
  'invoiceDate',
  'invoiceNumber',
  'billedTo',
  'totalAmount',
  'status',
  'dueDate',
  'updatedAt',
];

export const getInvoices = action.schema(getInvoicesSchema).action(async ({ parsedInput }) => {
    return backendPost<GetInvoicesResponse>('/workflows/invoice-actions/getInvoices', { input: parsedInput ?? {} });
  });

export const getInvoiceById = action
  .schema(getInvoiceByIdSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<GetInvoiceByIdResponse>('/workflows/invoice-actions/getInvoiceById', { input: parsedInput ?? {} });
  });

export const addInvoiceItem = action
  .schema(createInvoiceItemSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<AddInvoiceItemResponse>('/workflows/invoice-actions/addInvoiceItem', { input: parsedInput ?? {} });
  });

export const updateInvoiceItem = action
  .schema(updateInvoiceItemSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<UpdateInvoiceItemResponse>('/workflows/invoice-actions/updateInvoiceItem', { input: parsedInput ?? {} });
  });

export const deleteInvoiceItem = action
  .schema(deleteInvoiceItemSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/invoice-actions/deleteInvoiceItem', { input: parsedInput ?? {} });
  });

export const calculateInvoiceTotals = action
  .schema(getInvoiceByIdSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/invoice-actions/calculateInvoiceTotals', { input: parsedInput ?? {} });
  });
