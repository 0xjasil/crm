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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteEnquiry } from '@/lib/api/enquiry-api';

interface DeleteEnquiryDialogProps {
  enquiryId: string;
  candidateName: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteEnquiryDialog({
  enquiryId,
  candidateName,
  onSuccess,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeleteEnquiryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleDelete = async () => {
    setIsExecuting(true);
    try {
      const result = await deleteEnquiry(enquiryId);
      toast.success(result.message || 'Enquiry deleted successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete enquiry');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the enquiry for{' '}
            <span className="font-semibold text-foreground">{candidateName}</span>?
            <br />
            <br />
            This action cannot be undone. This will permanently delete the enquiry record and all
            associated data including follow-ups and call logs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => { event.preventDefault(); void handleDelete(); }}
            disabled={isExecuting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isExecuting ? 'Deleting...' : 'Delete Enquiry'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
