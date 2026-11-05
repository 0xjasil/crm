'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteInvoiceRecord } from '@/lib/api/invoice-api';
import { toast } from 'sonner';

interface DeleteInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNumber,
  onSuccess,
  open,
  onOpenChange,
}: DeleteInvoiceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteInvoiceRecord(invoiceId);
      toast.success('Invoice cancelled successfully');
      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel invoice <strong>{invoiceNumber}</strong>? Payment history will be retained.
            Public sharing and payment reminders will be disabled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Cancelling...' : 'Cancel Invoice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
