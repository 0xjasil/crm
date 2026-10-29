'use client';

import type { Enquiry, EnquiryFilters } from '@/types/enquiry';

type EnquiryListItem = Omit<Enquiry, 'createdAt' | 'updatedAt' | 'lastContactDate'> & {
  createdAt: string;
  updatedAt: string;
  lastContactDate?: string | null;
};

type EnquiryListResponse = {
  success: boolean;
  data?: EnquiryListItem[];
  message?: string;
  error?: { message?: string };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

type EnquiryResponse = {
  success: boolean;
  data?: EnquiryListItem;
  message?: string;
  error?: { message?: string };
};

export async function fetchEnquiry(id: string) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Your session has expired. Sign in again to continue.');

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
  const response = await fetch(`${apiUrl}/enquiries/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const result: EnquiryResponse = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error?.message || result.message || 'Failed to fetch enquiry');
  }

  const enquiry = result.data;
  const data: Enquiry = {
    ...enquiry,
    createdAt: new Date(enquiry.createdAt),
    updatedAt: new Date(enquiry.updatedAt),
    lastContactDate: enquiry.lastContactDate ? new Date(enquiry.lastContactDate) : undefined,
  };
  return { success: true, data, message: result.message };
}

export async function fetchEnquiries(filters: EnquiryFilters = {}) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Your session has expired. Sign in again to continue.');

  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (filters.assignedToUserId) params.set('assignedToUserId', filters.assignedToUserId);
  if (filters.enquirySourceId) params.set('enquirySourceId', filters.enquirySourceId);
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.isAssigned !== undefined) params.set('isAssigned', String(filters.isAssigned));
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
  if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
  const response = await fetch(`${apiUrl}/enquiries?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const result: EnquiryListResponse = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || result.message || 'Failed to fetch enquiries');
  }

  return {
    success: true,
    data: (result.data || []).map((enquiry): Enquiry => ({
      ...enquiry,
      createdAt: new Date(enquiry.createdAt),
      updatedAt: new Date(enquiry.updatedAt),
      lastContactDate: enquiry.lastContactDate ? new Date(enquiry.lastContactDate) : undefined,
    })),
    message: result.message,
    pagination: result.pagination ? { ...result.pagination, pages: result.pagination.totalPages } : undefined,
  };
}
