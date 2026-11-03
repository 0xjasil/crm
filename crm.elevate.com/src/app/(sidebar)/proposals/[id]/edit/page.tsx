'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { ProposalStatus } from '@/types/proposal';
import { ProposalCustomerPicker } from '@/components/proposals/proposal-customer-picker';
import { getInvoiceProductCatalog, InvoiceProductItem, RequiredCapacity } from '@/server/actions/invoice-catalog-actions';
import { InvoiceCustomer } from '@/lib/api/invoice-api';
import {
  getProposalById,
  updateProposal,
} from '@/server/actions/proposal/proposal-actions';
import { getAllBranches } from '@/server/actions/data-management';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const proposalItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  panelBrand: z.string().nullable().optional(),
  systemPrice: z.number().min(0).default(0),
  ksebFee: z.number().min(0).default(0),
  afterSubsidy: z.number().min(0).nullable().optional(),
  itemTaxRate: z.number().min(0).max(100).default(0),
});

const updateProposalSchema = z.object({
  title: z.string().optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
  clientName: z.string().min(1, 'Client Name is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  branch: z.string().optional(),
  validUntil: z.string().optional(),
  taxRate: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(proposalItemSchema).min(1, 'At least one item is required'),
});

type ProposalFormValues = z.infer<typeof updateProposalSchema>;

export default function EditProposalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<InvoiceProductItem[]>([]);
  const [capacities, setCapacities] = useState<RequiredCapacity[]>([]);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(updateProposalSchema) as any,
    defaultValues: {
      title: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      branch: '',
      status: ProposalStatus.DRAFT,
      validUntil: '',
      taxRate: 0,
      discountAmount: 0,
      terms: '',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, systemPrice: 0, ksebFee: 0, itemTaxRate: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    async function loadBranches() {
      const res = await getAllBranches();
      if (res.success && Array.isArray(res.data)) {
        setBranches(res.data);
      }
    }
    loadBranches();
  }, []);

  useEffect(() => {
    getInvoiceProductCatalog().then((result) => { setCatalog(result.catalog || []); setCapacities(result.requiredCapacities || []); }).catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load invoice products.'));
  }, []);

  const applyInvoiceCustomer = (customer: InvoiceCustomer) => {
    form.setValue('clientName', customer.name);
    form.setValue('clientEmail', customer.email || '');
    form.setValue('clientPhone', customer.phone || '');
    form.setValue('clientAddress', customer.address || '');
  };

  const addCapacity = (capacity: RequiredCapacity) => {
    const grandTotal = capacity.grandTotal || capacity.courseFee + capacity.admissionFee;
    append({ description: capacity.description || `${capacity.name} Solar System${capacity.brand ? ` with ${capacity.brand} Panels` : ''}`, quantity: 1, unitPrice: grandTotal, panelBrand: capacity.brand || null, systemPrice: capacity.courseFee, ksebFee: capacity.admissionFee, afterSubsidy: capacity.afterSubsidy ?? null, itemTaxRate: 0 });
  };

  const addCatalogItem = (product: InvoiceProductItem) => {
    const capacity = capacities.find((entry) => entry.id === product.capacityId || entry.id === product.id);
    if (capacity) { addCapacity(capacity); return; }
    append({ description: product.description || product.name, quantity: product.quantity || 1, unitPrice: product.price, systemPrice: product.price, ksebFee: 0, itemTaxRate: 0 });
  };

  useEffect(() => {
    const fetchProposal = async () => {
      setIsLoading(true);
      try {
        const res = await getProposalById({ id });
        if (res?.data?.success && res.data.data) {
          const proposal = res.data.data;
          form.reset({
            title: proposal.title || '',
            clientName: proposal.clientName || '',
            clientEmail: proposal.clientEmail || '',
            clientPhone: proposal.clientPhone || '',
            clientAddress: proposal.clientAddress || '',
            branch: proposal.branch || '',
            status: proposal.status || ProposalStatus.DRAFT,
            validUntil: proposal.validUntil
              ? new Date(proposal.validUntil).toISOString().split('T')[0]
              : '',
            taxRate: Number(proposal.taxRate) || 0,
            discountAmount: Number(proposal.discountAmount) || 0,
            terms: proposal.terms || '',
            notes: proposal.notes || '',
            items:
              proposal.items && proposal.items.length > 0
                ? proposal.items.map((item: any) => ({
                    id: item.id,
                    description: item.description,
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                    panelBrand: item.panelBrand || null,
                    systemPrice: item.systemPrice == null ? Number(item.unitPrice) || 0 : Number(item.systemPrice),
                    ksebFee: Number(item.ksebFee) || 0,
                    afterSubsidy: item.afterSubsidy == null ? null : Number(item.afterSubsidy),
                    itemTaxRate: Number(item.itemTaxRate) || 0,
                  }))
                : [{ description: '', quantity: 1, unitPrice: 0 }],
          });
        } else {
          toast.error(res?.data?.message || 'Failed to load proposal');
        }
      } catch (error) {
        console.error(error);
        toast.error('An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id, form]);

  const watchedItems = form.watch('items') || [];
  const taxRate = Number(form.watch('taxRate') || 0);
  const discountAmount = Number(form.watch('discountAmount') || 0);

  const itemTaxTotal = watchedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0) * (Number(item?.itemTaxRate) || 0) / 100, 0);
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0) * (1 + (Number(item?.itemTaxRate) || 0) / 100),
    0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const onSubmit = async (data: ProposalFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await updateProposal({ id, ...data });
      if (res?.data?.success) {
        toast.success('Proposal updated successfully!');
        router.push(`/proposals/${id}`);
      } else {
        toast.error(res?.data?.message || 'Failed to update proposal');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading proposal for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4 border-b pb-5">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Edit Proposal
          </h1>
          <p className="text-sm text-muted-foreground">
            Update pricing, items, and commercial terms
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & Branch Card */}
        <Card className="shadow-xs border-muted/80">
          <CardHeader className="bg-muted/20 pb-4">
            <CardTitle className="text-base font-semibold">Client & Subject Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5">
            <div className="grid gap-2"><Label>Invoice Customer</Label><ProposalCustomerPicker onSelect={applyInvoiceCustomer} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="clientName">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input id="clientName" {...form.register('clientName')} />
                {form.formState.errors.clientName && (
                  <p className="text-xs text-destructive">{form.formState.errors.clientName.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="title">Proposal Subject</Label>
                <Input id="title" {...form.register('title')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input id="clientPhone" {...form.register('clientPhone')} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="clientEmail">Email</Label>
                <Input id="clientEmail" type="email" {...form.register('clientEmail')} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={form.watch('branch')}
                  onValueChange={(val) => form.setValue('branch', val)}
                >
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                    {branches.length === 0 && <SelectItem value="Main Branch">Main Branch</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="clientAddress">Site Address</Label>
                <Input id="clientAddress" {...form.register('clientAddress')} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" {...form.register('validUntil')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card className="shadow-xs border-muted/80">
          <CardHeader className="bg-muted/20 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Items & Pricing
              </CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, systemPrice: 0, ksebFee: 0, itemTaxRate: 0 })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <Select onValueChange={(productId) => { const capacity = capacities.find((item) => item.id === productId); if (capacity) { addCapacity(capacity); return; } const product = catalog.find((item) => item.id === productId); if (product) addCatalogItem(product); }}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose invoice catalog product…" /></SelectTrigger>
              <SelectContent>{capacities.map((item) => <SelectItem key={`capacity-${item.id}`} value={item.id}>{item.name}{item.brand ? ` · ${item.brand} Panels` : ''} · ₹{(item.grandTotal || item.courseFee + item.admissionFee).toLocaleString('en-IN')}</SelectItem>)}{catalog.filter((item) => item.category !== 'capacity').map((item) => <SelectItem key={`product-${item.id}`} value={item.id}>{item.name} · ₹{item.price.toLocaleString('en-IN')}</SelectItem>)}</SelectContent>
            </Select>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col md:flex-row gap-3 items-start p-3 border rounded-lg bg-zinc-50/70 dark:bg-zinc-900/50"
              >
                <div className="flex-1 grid gap-1.5 w-full">
                  <Label className="text-xs text-muted-foreground">Item #{index + 1} Description</Label>
                  <Input {...form.register(`items.${index}.description`)} />
                  {form.formState.errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 md:w-[420px] gap-2">
                  <div className="grid gap-1"><Label className="text-xs text-muted-foreground">Panel</Label><Input value={watchedItems[index]?.panelBrand || ''} placeholder="Panel brand" onChange={(e) => form.setValue(`items.${index}.panelBrand`, e.target.value || null)} /></div>
                  <div className="grid gap-1"><Label className="text-xs text-muted-foreground">System Price (₹)</Label><Input type="number" min="0" value={watchedItems[index]?.systemPrice ?? 0} onChange={(e) => { const systemPrice = Number(e.target.value); form.setValue(`items.${index}.systemPrice`, systemPrice); form.setValue(`items.${index}.unitPrice`, systemPrice + (Number(watchedItems[index]?.ksebFee) || 0)); }} /></div>
                  <div className="grid gap-1"><Label className="text-xs text-muted-foreground">KSEB Bill (₹)</Label><Input type="number" min="0" value={watchedItems[index]?.ksebFee ?? 0} onChange={(e) => { const ksebFee = Number(e.target.value); form.setValue(`items.${index}.ksebFee`, ksebFee); form.setValue(`items.${index}.unitPrice`, (Number(watchedItems[index]?.systemPrice) || 0) + ksebFee); }} /></div>
                  <div className="grid gap-1"><Label className="text-xs text-muted-foreground">After Subsidy (₹)</Label><Input type="number" min="0" value={watchedItems[index]?.afterSubsidy ?? ''} onChange={(e) => form.setValue(`items.${index}.afterSubsidy`, e.target.value === '' ? null : Number(e.target.value))} /></div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-24 grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="w-36 grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">Grand Total (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={watchedItems[index]?.unitPrice ?? 0}
                      readOnly
                      aria-label="Grand total from system price and KSEB bill"
                    />
                  </div>

                  <div className="w-28 grid gap-1.5"><Label className="text-xs text-muted-foreground">Item Tax (%)</Label><Input type="number" min="0" max="100" step="0.01" {...form.register(`items.${index}.itemTaxRate`, { valueAsNumber: true })} /></div>

                  <div className="w-36 grid gap-1.5 text-right">
                    <Label className="text-xs text-muted-foreground">Total</Label>
                    <div className="h-9 px-3 flex items-center justify-end font-semibold text-sm bg-white dark:bg-zinc-950 border rounded-md">
                      ₹
                      {(
                        (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) * (1 + (watchedItems[index]?.itemTaxRate || 0) / 100)
                      ).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Separator className="my-6" />

            {/* Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="taxRate" className="text-xs">
                      GST (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      {...form.register('taxRate', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discountAmount" className="text-xs">
                      Discount (₹)
                    </Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      {...form.register('discountAmount', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs">
                    Status
                  </Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(val) => form.setValue('status', val as ProposalStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProposalStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={ProposalStatus.SENT}>Submitted / Sent</SelectItem>
                      <SelectItem value={ProposalStatus.ACCEPTED}>Approved / Confirmed</SelectItem>
                      <SelectItem value={ProposalStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/30 border rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal (includes item tax):</span>
                  <span className="font-medium text-foreground">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {itemTaxTotal > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>Item taxes included:</span><span>+₹{itemTaxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST ({taxRate}%):</span>
                    <span className="font-medium text-foreground">
                      +₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-medium">
                      -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-base font-bold">Total Amount:</span>
                  <span className="text-2xl font-extrabold text-primary">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t bg-muted/10 py-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
              {!isSubmitting && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
