'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAction } from 'next-safe-action/hooks';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Edit2, ArrowUpCircle } from 'lucide-react';

import { updateEnquiryStatusWithActivity } from '@/server/actions/enquiry-status-actions';
import { EnquiryStatus } from '@/types/enquiry';

const statusUpdateSchema = z.object({
  newStatus: z.nativeEnum(EnquiryStatus),
  statusRemarks: z.string().optional(),
});

type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;

interface StatusUpdateDialogProps {
  enquiryId: string;
  currentStatus: EnquiryStatus;
  candidateName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StatusUpdateDialog({
  enquiryId,
  currentStatus,
  candidateName,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: StatusUpdateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Actions
  const {
    execute: updateStatusAction,
    result: updateResult,
    isExecuting: isUpdating,
  } = useAction(updateEnquiryStatusWithActivity);

  const isExecuting = isUpdating;

  // Form
  const form = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      newStatus: undefined,
      statusRemarks: '',
    },
  });

  // Status options - exclude current status
  const getStatusOptions = () => {
    return Object.values(EnquiryStatus).filter((status) => status !== currentStatus);
  };

  // Status display names
  const getStatusDisplayName = (status: EnquiryStatus) => {
    switch (status) {
      case EnquiryStatus.NEW:
        return 'New';
      case EnquiryStatus.CONTACTED:
        return 'Contacted';
      case EnquiryStatus.CONFIRMED:
        return 'Confirmed';
      case EnquiryStatus.NOT_INTERESTED:
        return 'Not Interested';
      case EnquiryStatus.FOLLOW_UP:
        return 'Follow Up';
      case EnquiryStatus.DROPPED:
        return 'Dropped';
      case EnquiryStatus.INVALID:
        return 'Invalid';
      default:
        return status;
    }
  };

  // Monitor action results
  useEffect(() => {
    if (!isProcessingAction) return;

    const result = updateResult;
    if (result?.data?.success) {
      const message = result.data.message || 'Status updated successfully';
      toast.success(message);
      setOpen(false);
      form.reset();
      setIsProcessingAction(false);
      onSuccess?.();
    } else if (result?.serverError) {
      toast.error(`Error updating status: ${result.serverError}`);
      setIsProcessingAction(false);
    } else if (result?.validationErrors) {
      const errorMessages = Object.entries(result.validationErrors)
        .flat()
        .join(', ');
      toast.error(`Validation error: ${errorMessages}`);
      setIsProcessingAction(false);
    }
  }, [updateResult, form, setOpen, onSuccess, isProcessingAction]);

  const onSubmit = async (data: StatusUpdateFormData) => {
    try {
      setIsProcessingAction(true);

      updateStatusAction({
        id: enquiryId,
        newStatus: data.newStatus,
        statusRemarks: data.statusRemarks,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      setIsProcessingAction(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isExecuting) {
      setOpen(newOpen);
      if (!newOpen) {
        form.reset({
          newStatus: undefined,
          statusRemarks: '',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5" />
            Update Status
          </DialogTitle>
          <DialogDescription>
            Update the status for <strong>{candidateName}</strong>.
            Current status: <strong>{getStatusDisplayName(currentStatus)}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="newStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getStatusOptions().map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusDisplayName(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statusRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Remarks (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any remarks about this status change..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                    Updating Status...
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
