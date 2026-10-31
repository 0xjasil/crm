'use server';

import { backendPost } from '@/lib/api/backend-server';

export interface RequiredCapacity {
  id: string;
  name: string; // e.g. "3 KW"
  brand?: string | null; // e.g. "WAREE"
  courseFee: number;
  admissionFee: number;
  grandTotal: number;
  afterSubsidy?: number | null;
  description?: string | null;
}

export interface InvoiceProductItem {
  id: string;
  name: string;
  price: number;
  category: 'capacity' | 'proposal' | 'component';
  description?: string;
  quantity?: number;
  capacityId?: string;
  brand?: string;
  proposalId?: string;
  proposalNo?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface ProposalMatch {
  id: string;
  proposalNo: string;
  clientName: string;
  clientPhone?: string;
  totalAmount: number;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export async function getInvoiceProductCatalog(customerQuery?: {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  sourceType?: string;
}): Promise<{
  success: boolean;
  catalog: InvoiceProductItem[];
  requiredCapacities: RequiredCapacity[];
  matchingProposals: ProposalMatch[];
}> {
  return backendPost<{ success: boolean; catalog: InvoiceProductItem[]; requiredCapacities: RequiredCapacity[]; matchingProposals: ProposalMatch[]; }>('/workflows/invoice-catalog-actions/getInvoiceProductCatalog', { customerQuery });
}
