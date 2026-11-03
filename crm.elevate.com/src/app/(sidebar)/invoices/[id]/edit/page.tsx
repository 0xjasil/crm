'use client';

import { useParams } from 'next/navigation';
import { NewInvoiceForm } from '@/components/invoice/new-invoice-form';

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  return <NewInvoiceForm mode="edit" invoiceId={params.id} />;
}
