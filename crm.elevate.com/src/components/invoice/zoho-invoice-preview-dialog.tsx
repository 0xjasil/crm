"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  ExternalLink,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Eye,
  Printer,
  Loader2,
} from "lucide-react";
import { InvoiceWithItems, InvoiceStatus } from "@/types/invoice";
import { formatCurrency } from "@/lib/utils";
import { downloadZohoInvoicePdf, getZohoInvoicePdfBlobUrl } from "@/lib/invoice-zoho-pdf";
import { toast } from "sonner";
import { openPdfViewer } from "@/lib/open-pdf-viewer";

interface ZohoInvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithItems | null;
}

export function ZohoInvoicePreviewDialog({
  open,
  onOpenChange,
  invoice,
}: ZohoInvoicePreviewDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"sheet" | "pdf">("sheet");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(true);
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  // Generate real PDF blob URL whenever dialog opens
  useEffect(() => {
    setPdfBlobUrl(null);
    setPdfError(null);
    setIsPreviewLoading(true);
    if (!open || !invoice) {
      setIsPreparingPdf(false);
      return;
    }
    setIsPreparingPdf(true);
    let previewUrl: string | undefined;
    // Allow the preparation state to render before generating the PDF.
    const timer = window.setTimeout(() => {
      try {
        previewUrl = getZohoInvoicePdfBlobUrl(invoice);
        setPdfBlobUrl(previewUrl);
      } catch (err) {
        console.error("Error creating PDF preview blob:", err);
        setPdfError('Could not prepare the PDF preview. Try Download PDF.');
      } finally {
        setIsPreparingPdf(false);
      }
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [open, invoice]);

  if (!invoice) return null;

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(date);
    }
  };

  const handleDownload = () => {
    try {
      setIsExporting(true);
      downloadZohoInvoicePdf(invoice);
      toast.success(`Invoice ${invoice.invoiceNumber} PDF downloaded successfully!`);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPdfTab = (forPrint = false) => {
    if (isOpeningPdf) return;
    setIsOpeningPdf(true);
    try {
      openPdfViewer(() => getZohoInvoicePdfBlobUrl(invoice));
      if (forPrint) {
        toast.info('Use the PDF viewer’s Print button once the invoice loads. If it does not display, use Download PDF.');
      }
    } catch (err: unknown) {
      console.error("Failed to open PDF tab:", err);
      toast.error(err instanceof Error ? err.message : 'Could not open the PDF. Try Download PDF.');
    } finally {
      setIsOpeningPdf(false);
    }
  };

  const handlePrint = () => {
    handleOpenPdfTab(true);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> PAID
          </Badge>
        );
      case InvoiceStatus.PARTIALLY_PAID:
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
            <Clock className="w-3 h-3 mr-1" /> PARTIALLY PAID
          </Badge>
        );
      case InvoiceStatus.OVERDUE:
        return (
          <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
            <AlertCircle className="w-3 h-3 mr-1" /> OVERDUE
          </Badge>
        );
      case InvoiceStatus.SENT:
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Clock className="w-3 h-3 mr-1" /> SENT
          </Badge>
        );
      case InvoiceStatus.CANCELLED:
        return (
          <Badge variant="secondary" className="text-muted-foreground font-semibold">
            <XCircle className="w-3 h-3 mr-1" /> CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-semibold text-slate-700 border-slate-300">
            DRAFT
          </Badge>
        );
    }
  };

  const subtotal = Number(invoice.subtotal || 0);
  const taxAmount = Number(invoice.taxAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const balanceDue = Number(
    invoice.balanceDue ?? (totalAmount - amountPaid)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden border border-slate-300 dark:border-zinc-800 shadow-2xl"
        style={{ backgroundColor: "#f8fafc" }}
      >
        {/* Modal Top Bar (100% Solid Header) */}
        <DialogHeader
          className="p-3.5 border-b flex flex-row items-center justify-between space-y-0 shrink-0"
          style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                Zeeone Solar
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  #{invoice.invoiceNumber}
                </span>
              </DialogTitle>
            </div>
          </div>

          {/* Action Buttons & View Mode Toggle */}
          <div className="flex items-center gap-2 mr-6">
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("sheet")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "sheet"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Document
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pdf")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "pdf"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Real PDF
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={isPreparingPdf || isOpeningPdf}
              className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" />
              {isPreparingPdf ? 'Preparing PDF...' : 'Print'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenPdfTab()}
              disabled={isPreparingPdf || isOpeningPdf}
              className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              New Tab
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Real PDF View Mode */}
        {viewMode === "pdf" ? (
          <div className="relative flex-1 min-h-[60vh] w-full h-[76vh] bg-slate-100 p-2">
            {pdfError ? (
              <div role="alert" className="p-6 text-center text-sm text-slate-700">
                <p>{pdfError}</p>
                <Button className="mt-3" onClick={handleDownload} disabled={isExporting}>Download PDF</Button>
              </div>
            ) : isPreparingPdf || !pdfBlobUrl ? (
              <div role="status" className="flex items-center justify-center gap-2 p-6 text-sm text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing PDF...
              </div>
            ) : (
              <>
                <p className="mb-2 text-center text-xs text-slate-600">
                  {isPreviewLoading ? 'Loading PDF viewer. ' : ''}
                  If the PDF does not display, use New Tab or Download PDF above.
                </p>
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-[calc(100%-2rem)] min-h-[55vh] border-0 rounded-md shadow-inner bg-white"
                  title={`Invoice-${invoice.invoiceNumber}`}
                  onLoad={() => setIsPreviewLoading(false)}
                  onError={() => setPdfError('The PDF viewer could not load. Use New Tab or Download PDF.')}
                />
              </>
            )}
          </div>
        ) : (
          /* Live Document Sheet Preview (100% Solid Pure White Paper) */
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center"
            style={{ backgroundColor: "#f1f5f9" }}
          >
            <div
              className="w-full max-w-3xl shadow-xl rounded-lg border p-6 sm:p-8 space-y-5 my-auto"
              style={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                borderColor: "#e2e8f0",
              }}
            >
              {/* Top Accent Strip */}
              <div
                className="h-1.5 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 rounded-t-lg"
                style={{ backgroundColor: "#2563eb" }}
              />

              {/* Header: Company Details & Tax Invoice */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    ZeeOne Solar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Solar Rooftop EPC & Green Energy Solutions
                  </p>
                  <p className="text-xs text-slate-500">
                    Opp. Bharat Petroleum, Thiruvannur, Calicut
                  </p>
                  <p className="text-xs text-slate-500">
                    Email: zeeonegroup@gmail.com
                  </p>
                </div>

                <div className="sm:text-right space-y-1.5">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    TAX INVOICE
                  </h2>
                  <div>{getStatusBadge(invoice.status)}</div>
                  <div className="pt-1 text-xs text-slate-600 space-y-0.5">
                    <div>
                      <span className="text-slate-400">Invoice No: </span>
                      <strong className="font-mono text-slate-900">
                        #{invoice.invoiceNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Invoice Date: </span>
                      <strong className="text-slate-900">
                        {formatDate(invoice.invoiceDate)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Due Date: </span>
                      <strong className="text-slate-900">
                        {formatDate(invoice.dueDate || invoice.invoiceDate)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full" style={{ backgroundColor: "#e2e8f0" }} />

              {/* 2-Column Section: Billed To & Payment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-md border space-y-1"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Billed To / Site Owner
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {invoice.customer?.name || invoice.billedTo}
                  </p>
                  {invoice.customer?.address && (
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {invoice.customer.address}
                    </p>
                  )}
                  {invoice.customer?.phone && (
                    <p className="text-xs text-slate-600">
                      Tel: <span className="font-medium text-slate-800">{invoice.customer.phone}</span>
                    </p>
                  )}
                  {invoice.customer?.email && (
                    <p className="text-xs text-slate-600">
                      Email: <span className="font-medium text-slate-800">{invoice.customer.email}</span>
                    </p>
                  )}
                  {invoice.customer?.gstin && (
                    <p className="text-xs text-slate-600 font-mono">
                      GSTIN: {invoice.customer.gstin}
                    </p>
                  )}
                </div>

                <div
                  className="p-4 rounded-md border space-y-2"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Payment Summary
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Invoice Amount:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Amount Paid:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(amountPaid)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between pt-1.5 border-t font-bold text-xs"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <span className="text-slate-800">Balance Due:</span>
                      <span
                        className={
                          balanceDue > 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        {formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div
                className="rounded-md border overflow-hidden"
                style={{ borderColor: "#e2e8f0" }}
              >
                <table className="w-full text-xs text-left">
                  <thead
                    className="text-white uppercase text-[11px] font-semibold tracking-wider"
                    style={{ backgroundColor: "#1e293b" }}
                  >
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-4">Item & Description</th>
                      <th className="py-2.5 px-3 text-right w-16">Qty</th>
                      <th className="py-2.5 px-4 text-right w-28">Rate</th>
                      <th className="py-2.5 px-4 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#e2e8f0" }}>
                    {(invoice.items && invoice.items.length > 0
                      ? invoice.items
                      : [
                          {
                            id: "default",
                            itemDescription: "Solar EPC Project & Installation Services",
                            quantity: 1,
                            unitPrice: invoice.subtotal || invoice.totalAmount,
                            lineTotal: invoice.subtotal || invoice.totalAmount,
                          },
                        ]
                    ).map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{
                          backgroundColor: idx % 2 === 1 ? "#f8fafc" : "#ffffff",
                        }}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.itemDescription}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 font-mono">
                          {formatCurrency(Number(item.unitPrice || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono">
                          {formatCurrency(
                            Number(
                              item.lineTotal || item.quantity * item.unitPrice
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Bank Details */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Bank & Payment Details
                  </h4>
                  <div
                    className="p-3 rounded-md border space-y-1 text-slate-600"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <p>
                      <span className="text-slate-400">Bank Name:</span> HDFC Bank
                    </p>
                    <p>
                      <span className="text-slate-400">Account Name:</span> ZEE ONE GROUP
                    </p>
                    <p>
                      <span className="text-slate-400">Account Number:</span>{" "}
                      <span className="font-mono font-medium text-slate-900">50200121862191</span>
                    </p>
                    <p>
                      <span className="text-slate-400">IFSC Code:</span>{" "}
                      <span className="font-mono font-medium text-slate-900">HDFC0004077</span>
                    </p>

                  </div>

                  {invoice.notes && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Notes:
                      </span>
                      <p
                        className="text-xs text-slate-600 p-2.5 rounded border mt-0.5"
                        style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                      >
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>
                        Tax Amount{invoice.taxRate ? ` (${(invoice.taxRate * 100).toFixed(0)}%)` : ""}:
                      </span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}
                  {Number(invoice.serviceCharge || 0) > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Service Charge:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(Number(invoice.serviceCharge))}
                      </span>
                    </div>
                  )}
                  {Number(invoice.otherCharges || 0) > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Other Charges:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatCurrency(Number(invoice.otherCharges))}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex justify-between py-2 border-t border-b font-bold text-sm text-slate-900"
                    style={{ borderColor: "#cbd5e1" }}
                  >
                    <span>Total Amount:</span>
                    <span className="font-mono text-base">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(amountPaid)}</span>
                  </div>
                  <div
                    className="flex justify-between py-1.5 px-2.5 rounded font-bold text-xs"
                    style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <span className="text-slate-800">Balance Due:</span>
                    <span
                      className={`font-mono text-sm ${
                        balanceDue > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Footer (Zero Unwanted Space) */}
              <div
                className="pt-4 mt-2 border-t flex flex-col sm:flex-row justify-between items-center text-[10.5px] text-slate-500 gap-2"
                style={{ borderColor: "#e2e8f0" }}
              >
                <p className="text-center sm:text-left">
                  Terms & Conditions: 1. Payment due upon presentation. 2. Solar subsidy subject to discom rules. 3. Computer generated invoice.
                </p>
                <p className="font-semibold text-slate-700 whitespace-nowrap">
                  Authorized Signatory: ZEE ONE GROUP
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
