'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
  Eye,
  IndianRupee,
  Pencil,
  Send,
  Share2,
  Bell,
} from 'lucide-react';
import { getInvoiceRecord, createInvoiceShare, revokeInvoiceShare, fetchInvoicePdf, sendInvoiceEmail } from '@/lib/api/invoice-api';
import { toast } from 'sonner';
import { InvoiceWithItems, InvoiceStatus } from '@/types/invoice';
import { formatCurrency } from '@/lib/utils';
import { InvoiceItemsSection } from '@/components/invoice/invoice-items-section';
import { InvoiceTotals } from '@/components/invoice/invoice-totals';
import { InvoiceStatusUpdate } from '@/components/invoice/invoice-status-update';
import { InvoicePaymentHistory } from '@/components/invoice/invoice-payment-history';
import { RecordPaymentDialog, RemindersDialog } from '@/components/invoice/invoice-payments';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadZohoInvoicePdf, getZohoInvoicePdfBlobUrl } from '@/lib/invoice-zoho-pdf';
import { ZohoInvoicePreviewDialog } from '@/components/invoice/zoho-invoice-preview-dialog';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [zohoPreviewOpen, setZohoPreviewOpen] = useState(false);

  // Fetch invoice data
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    setIsLoading(true);
    try {
      const result = await getInvoiceRecord(invoiceId);
      setInvoice(result as unknown as InvoiceWithItems);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to fetch invoice');
      router.push('/invoices');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, router]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleBack = () => {
    router.push('/invoices');
  };

  const handleGeneratePDF = async (download: boolean = false) => {
    if (!invoice) return;
    try {
      setIsGeneratingPDF(true);
      if (download) {
        downloadZohoInvoicePdf(invoice);
        toast.success(`Invoice ${invoice.invoiceNumber} PDF downloaded.`);
      } else {
        setZohoPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      try {
        const pdf = await fetchInvoicePdf(invoiceId);
        const url = URL.createObjectURL(pdf);
        if (download) {
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
          anchor.click();
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast.success(download ? 'Invoice PDF downloaded.' : 'Invoice PDF opened.');
      } catch (backendErr) {
        toast.error('Failed to generate PDF.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    try {
      let token = invoice?.shareToken;
      if (!token) {
        const result = await createInvoiceShare(invoiceId);
        token = result.shareToken;
        setInvoice((current) => current ? { ...current, shareToken: token } : current);
        toast.success('Public invoice link created.');
      }
      const url = `${window.location.origin}/public/invoices/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not create share link.'); }
  };

  const handleRevokeShare = async () => {
    try {
      await revokeInvoiceShare(invoiceId);
      setInvoice((current) => current ? { ...current, shareToken: null } : current);
      toast.success('Public invoice link revoked.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not revoke share link.'); }
  };

  const handleSendInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSending(true);
    try {
      await sendInvoiceEmail(invoiceId, sendEmail.trim() || undefined);
      toast.success('Invoice emailed with the PDF attached.');
      setSendOpen(false);
      await fetchInvoice();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not send invoice.'); }
    finally { setIsSending(false); }
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: Circle,
          label: 'Draft',
        };
      case InvoiceStatus.SENT:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          label: 'Sent',
        };
      case InvoiceStatus.PARTIALLY_PAID:
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Partially Paid' };
      case InvoiceStatus.PAID:
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle,
          label: 'Paid',
        };
      case InvoiceStatus.OVERDUE:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          label: 'Overdue',
        };
      case InvoiceStatus.CANCELLED:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle,
          label: 'Cancelled',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Circle,
          label: status,
        };
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-width-1150 @container/main flex flex-1 flex-col gap-2.5 px-5 py-1.5 sm:gap-6 sm:p-4 md:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-width-1150 @container/main flex flex-1 flex-col gap-2.5 px-5 py-1.5 sm:gap-6 sm:p-4 md:p-6">
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Invoice not found</h3>
            <p className="text-muted-foreground">
              The invoice you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-width-1150 relative @container/main flex flex-1 flex-col gap-5 p-3 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-all text-xl font-bold tracking-tight sm:text-2xl">Invoice {invoice.invoiceNumber}</h1>
              <Badge variant="outline" className={`${statusConfig.color} border px-2.5 py-1`}>
                <StatusIcon className="mr-1.5 h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created on {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:max-w-[680px] sm:flex-wrap sm:justify-end">
          <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}><Pencil className="mr-1.5 size-4" />Edit</Button>
          <Button size="sm" variant="outline" onClick={() => { setSendEmail(invoice.customer?.email || ''); setSendOpen(true); }}><Send className="mr-1.5 size-4" />Send</Button>
          <Button size="sm" variant="outline" onClick={() => void handleShare()}><Share2 className="mr-1.5 size-4" />Share</Button>
          <Button size="sm" variant="outline" onClick={() => setRemindersOpen(true)}><Bell className="mr-1.5 size-4" />Reminders</Button>
          {Number(invoice.balanceDue ?? invoice.totalAmount - (invoice.amountPaid ?? 0)) > 0 && ![InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED].includes(invoice.status) && <Button size="sm" onClick={() => setPaymentOpen(true)}><IndianRupee className="mr-1 size-4" />Record Payment</Button>}
          <Button size="sm" variant="outline" onClick={() => setZohoPreviewOpen(true)}><Eye className="mr-1.5 size-4" />Preview PDF</Button>
          <Button size="sm" variant="outline" onClick={() => handleGeneratePDF(true)} disabled={isGeneratingPDF}><Download className="mr-1.5 size-4" />Download PDF</Button>
          {invoice.shareToken && <Button size="sm" variant="ghost" onClick={() => void handleRevokeShare()}>Revoke link</Button>}
        </div>
      </div>

      {Number(invoice.amountPaid ?? 0) > 0 && Number(invoice.balanceDue ?? 0) > 0 && (
        <div role="status" className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <span>Invoice has been partially paid. Balance due: {formatCurrency(Number(invoice.balanceDue))}.</span>
          <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>Record payment</Button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column - Invoice Details and Items */}
        <div className="min-w-0 space-y-5">
          {/* Invoice Information Card */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-5">
              <CardTitle className="flex items-center gap-2 text-base"><Receipt className="size-4" />Invoice information</CardTitle>
              <CardDescription>Customer billing details and invoice dates</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(250px,.9fr)] sm:p-5">
              <section className="min-w-0 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><User className="size-4 text-muted-foreground" />Billed to</div>
                <div className="rounded-lg border bg-muted/10 p-4">
                  <h3 className="break-words text-base font-semibold">{invoice.customer?.name || invoice.billedTo.split('\n')[0]}</h3>
                  <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {invoice.customer?.phone && <div className="min-w-0"><span className="block text-xs text-muted-foreground">Phone</span><span className="break-all">{invoice.customer.phone}</span></div>}
                    {invoice.customer?.email && <div className="min-w-0"><span className="block text-xs text-muted-foreground">Email</span><span className="break-all">{invoice.customer.email}</span></div>}
                    {invoice.customer?.address && <div className="min-w-0 sm:col-span-2"><span className="block text-xs text-muted-foreground">Billing address</span><span className="whitespace-pre-wrap">{invoice.customer.address}</span></div>}
                    {invoice.customer?.state && <div><span className="block text-xs text-muted-foreground">State</span>{invoice.customer.state}</div>}
                    {invoice.customer?.gstin && <div><span className="block text-xs text-muted-foreground">GSTIN</span>{invoice.customer.gstin}</div>}
                    {!invoice.customer && <p className="whitespace-pre-wrap text-muted-foreground sm:col-span-2">{invoice.billedTo}</p>}
                  </div>
                </div>
                {invoice.notes && <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20"><h4 className="mb-1 font-semibold">Notes</h4><p className="whitespace-pre-wrap break-words text-muted-foreground">{invoice.notes}</p></div>}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Invoice details</h3>
                <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-lg border p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="size-3.5" />Invoice date</dt><dd className="mt-1 text-sm font-semibold">{formatDate(invoice.invoiceDate)}</dd></div>
                  <div className="rounded-lg border p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />Due date</dt><dd className="mt-1 text-sm font-semibold">{invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}</dd></div>
                  <div className="rounded-lg border p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><IndianRupee className="size-3.5" />Tax rate</dt><dd className="mt-1 text-sm font-semibold">{(invoice.taxRate * 100).toFixed(1)}%</dd></div>
                  <div className="rounded-lg border p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="size-3.5" />Created by</dt><dd className="mt-1 break-words text-sm font-semibold">{invoice.createdBy?.name || '—'}</dd></div>
                </dl>
              </section>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <InvoiceItemsSection
            invoiceId={invoice.id}
            items={invoice.items}
            onItemsChange={fetchInvoice}
          />
          <InvoicePaymentHistory invoice={invoice} onChange={fetchInvoice} />
        </div>

        {/* Right Column - Summary and Actions */}
        <div className="min-w-0 space-y-5">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-5"><CardTitle className="text-base">Invoice status</CardTitle><CardDescription>Update the current payment state</CardDescription></CardHeader>
            <CardContent className="p-4 sm:p-5"><InvoiceStatusUpdate invoiceId={invoice.id} currentStatus={invoice.status} onStatusUpdate={fetchInvoice} /></CardContent>
          </Card>
          <div className="xl:sticky xl:top-5 xl:self-start">
            <InvoiceTotals
              subtotal={invoice.subtotal}
              taxRate={invoice.taxRate}
              taxAmount={invoice.taxAmount}
              serviceCharge={invoice.serviceCharge}
              otherCharges={invoice.otherCharges}
              totalAmount={invoice.totalAmount}
              amountPaid={invoice.amountPaid ?? 0}
              balanceDue={invoice.balanceDue ?? invoice.totalAmount - (invoice.amountPaid ?? 0)}
            />
          </div>
        </div>
      </div>
      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} invoiceId={invoice.id} customerName={invoice.customer?.name || invoice.billedTo.split('\n')[0]} balanceDue={Number(invoice.balanceDue ?? invoice.totalAmount - (invoice.amountPaid ?? 0))} onSuccess={fetchInvoice} />
      <RemindersDialog open={remindersOpen} onOpenChange={setRemindersOpen} invoiceId={invoice.id} remindersEnabled={invoice.remindersEnabled ?? false} reminderRules={invoice.reminderRules ?? []} email={invoice.customer?.email} onSuccess={fetchInvoice} />
      <Dialog open={sendOpen} onOpenChange={(open) => { if (!isSending) setSendOpen(open); }}>
        <DialogContent><DialogHeader><DialogTitle>Send Invoice</DialogTitle><DialogDescription>Send the invoice PDF to your customer by email.</DialogDescription></DialogHeader><form onSubmit={(event) => void handleSendInvoice(event)} className="space-y-4"><label className="grid gap-2 text-sm font-medium">To<Input type="email" required value={sendEmail} onChange={(event) => setSendEmail(event.target.value)} placeholder="customer@example.com" /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setSendOpen(false)} disabled={isSending}>Cancel</Button><Button type="submit" disabled={isSending}>{isSending ? 'Sending…' : 'Send with PDF'}</Button></DialogFooter></form></DialogContent>
      </Dialog>
      <ZohoInvoicePreviewDialog
        open={zohoPreviewOpen}
        onOpenChange={setZohoPreviewOpen}
        invoice={invoice}
      />
    </div>
  );
}
