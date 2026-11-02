'use server';

import { backendPost } from '@/lib/api/backend-server';

import { actionClient } from '@/lib/safe-action';

import { z } from 'zod';

import { ProposalStatus } from '@/types/proposal';

const proposalItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

const createProposalSchema = z.object({
  title: z.string().optional(),
  clientName: z.string().min(1, 'Client Name is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional().or(z.literal('')),
  clientAddress: z.string().optional().or(z.literal('')),
  branch: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  enquiryId: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(ProposalStatus).default(ProposalStatus.DRAFT),
  validUntil: z.string().optional().or(z.literal('')),
  taxRate: z.number().default(0),
  discountAmount: z.number().default(0),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  items: z.array(proposalItemSchema).min(1, 'At least one item is required'),
});

const updateProposalSchema = z.object({
  id: z.string().min(1, 'Proposal ID is required'),
  title: z.string().optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional().or(z.literal('')),
  clientAddress: z.string().optional().or(z.literal('')),
  branch: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  enquiryId: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(ProposalStatus).optional(),
  validUntil: z.string().optional().or(z.literal('')),
  taxRate: z.number().optional(),
  discountAmount: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  items: z.array(proposalItemSchema).optional(),
});

export const getProposals = actionClient.action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: any[]; message?: undefined; } | { success: boolean; message: string; data: never[]; }>('/workflows/proposal-proposal-actions/getProposals', { input: parsedInput ?? {} });
  });

export const getProposalById = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; data?: undefined; } | { success: boolean; data: any; message?: undefined; }>('/workflows/proposal-proposal-actions/getProposalById', { input: parsedInput ?? {} });
  });

export const createProposal = actionClient
  .inputSchema(createProposalSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; data: any; message: string; } | { success: boolean; message: string; data?: undefined; }>('/workflows/proposal-proposal-actions/createProposal', { input: parsedInput ?? {} });
  });

export const updateProposal = actionClient
  .inputSchema(updateProposalSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/proposal-proposal-actions/updateProposal', { input: parsedInput ?? {} });
  });

export const deleteProposal = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/proposal-proposal-actions/deleteProposal', { input: parsedInput ?? {} });
  });
