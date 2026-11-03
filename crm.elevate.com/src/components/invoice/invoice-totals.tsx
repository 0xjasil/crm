'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceTotalsProps {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceCharge: number;
  otherCharges: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
}

export function InvoiceTotals({ subtotal, taxRate, taxAmount, serviceCharge, otherCharges, totalAmount, amountPaid = 0, balanceDue = totalAmount }: InvoiceTotalsProps) {
  const rows = [
    ['Subtotal', subtotal],
    [`Tax (${(taxRate * 100).toFixed(1)}%)`, taxAmount],
    ['Service charge', serviceCharge],
    ['Other charges', otherCharges],
  ] as const;

  return (
    <Card className="w-full overflow-hidden shadow-sm">
      <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-4 sm:px-5">
        <CardTitle className="flex items-center gap-2 text-base"><Calculator className="size-4 text-primary" />Invoice Summary</CardTitle>
        <CardDescription>Amounts and payment balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <dl className="space-y-3">
          {rows.map(([label, amount]) => <div key={label} className="flex items-start justify-between gap-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium tabular-nums">{formatCurrency(amount)}</dd></div>)}
        </dl>
        <Separator />
        <div className="rounded-lg border bg-primary/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold"><IndianRupee className="size-4 text-primary" />Total amount</div>
            <div className="text-right text-xl font-bold tabular-nums sm:text-2xl">{formatCurrency(totalAmount)}</div>
          </div>
        </div>
        <dl className="space-y-3 rounded-lg bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Payment made</dt><dd className="font-medium tabular-nums">{formatCurrency(amountPaid)}</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="font-semibold">Balance due</dt><dd className="font-semibold tabular-nums">{formatCurrency(balanceDue)}</dd></div>
        </dl>
      </CardContent>
    </Card>
  );
}
