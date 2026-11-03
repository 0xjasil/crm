import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getProposalById } from '@/server/actions/proposal/proposal-actions';

const money = (value: unknown) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', currencyDisplay: 'code', minimumFractionDigits: 2 }).format(Number(value) || 0).replace(/\u00a0/g, ' ');

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await getProposalById({ id });
    const proposal = result?.data?.data;
    if (!result?.data?.success || !proposal) return NextResponse.json({ success: false, message: result?.data?.message || 'Proposal not found' }, { status: 404 });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(20);
    doc.text('PROPOSAL / QUOTATION', 14, 18);
    doc.setFontSize(10);
    doc.text(`Proposal: ${proposal.proposalNo}`, 14, 26);
    doc.text(`Date: ${new Date(proposal.createdAt).toLocaleDateString('en-IN')}`, 14, 32);
    doc.text(`Valid until: ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN') : 'N/A'}`, 14, 38);
    doc.text(`Customer: ${proposal.clientName}`, pageWidth / 2, 26);
    doc.text(`Phone: ${proposal.clientPhone || 'N/A'}   Email: ${proposal.clientEmail || 'N/A'}`, pageWidth / 2, 32);
    const address = doc.splitTextToSize(`Address: ${proposal.clientAddress || 'N/A'}`, pageWidth / 2 - 18);
    doc.text(address, pageWidth / 2, 38);

    autoTable(doc, {
      startY: 49,
      head: [['Item', 'Panel', 'System Price', 'KSEB Bill', 'After Subsidy', 'Qty', 'Grand Total', 'Item Tax']],
      body: (proposal.items || []).map((item: any) => [
        item.description || '', item.panelBrand || '—', item.systemPrice == null ? '—' : money(item.systemPrice), item.ksebFee == null ? '—' : money(item.ksebFee),
        item.afterSubsidy == null ? '—' : money(item.afterSubsidy), String(item.quantity || 1), money(item.unitPrice), `${Number(item.itemTaxRate) || 0}% (${money(Number(item.unitPrice) * Number(item.quantity || 1) * (Number(item.itemTaxRate) || 0) / 100)})`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 76 }, 1: { cellWidth: 30 } },
    });
    const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 55;
    const summaryY = tableEnd + 9;
    const right = pageWidth - 14;
    doc.setFontSize(10);
    doc.text(`Subtotal (includes item tax): ${money(proposal.subtotal)}`, right, summaryY, { align: 'right' });
    doc.text(`Proposal tax (${Number(proposal.taxRate) || 0}%): ${money(proposal.taxAmount)}`, right, summaryY + 6, { align: 'right' });
    doc.text(`Discount: ${money(proposal.discountAmount)}`, right, summaryY + 12, { align: 'right' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ${money(proposal.totalAmount)}`, right, summaryY + 21, { align: 'right' });
    if (proposal.terms || proposal.notes) {
      const notesY = summaryY + 31;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const text = [proposal.terms ? `Terms: ${proposal.terms}` : '', proposal.notes ? `Notes: ${proposal.notes}` : ''].filter(Boolean).join('\n');
      doc.text(doc.splitTextToSize(text, pageWidth - 28), 14, notesY);
    }
    const bytes = doc.output('arraybuffer');
    return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${proposal.proposalNo}.pdf"` } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Could not generate proposal PDF' }, { status: 500 });
  }
}
