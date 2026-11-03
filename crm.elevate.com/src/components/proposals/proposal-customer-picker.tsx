'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createInvoiceCustomer, fetchInvoiceCustomers, InvoiceCustomer } from '@/lib/api/invoice-api';

export function ProposalCustomerPicker({ onSelect }: { onSelect: (customer: InvoiceCustomer) => void }) {
  const [customers, setCustomers] = useState<InvoiceCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', address: '', state: '', gstin: '' });

  useEffect(() => {
    fetchInvoiceCustomers().then(setCustomers).catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load customers.')).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(search.toLowerCase()));
  const saveCustomer = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const customer = await createInvoiceCustomer(draft);
      setCustomers((current) => [...current.filter((entry) => entry.id !== customer.id), customer].sort((a, b) => a.name.localeCompare(b.name)));
      onSelect(customer);
      setNewOpen(false);
      setDraft({ name: '', email: '', phone: '', address: '', state: '', gstin: '' });
      toast.success('Customer added.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create customer.');
    } finally { setSaving(false); }
  };

  return <>
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-between font-normal"><span className="flex items-center gap-2"><Search className="size-4" /> Select or search an invoice customer</span><ChevronDown className="size-4" /></Button></PopoverTrigger>
        <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] p-0">
          <div className="border-b p-2"><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" /></div>
          <div className="max-h-56 overflow-auto p-1">{loading ? <p className="p-4 text-center text-sm text-muted-foreground">Loading customers…</p> : filtered.length ? filtered.map((customer) => <button type="button" key={customer.id} onClick={() => { onSelect(customer); setOpen(false); setSearch(''); }} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted"><span><span className="block font-medium">{customer.name}</span><span className="text-xs text-muted-foreground">{[customer.email, customer.phone, customer.sourceType === 'admission' ? 'Admission' : customer.sourceType === 'enquiry' ? 'Enquiry' : 'Customer'].filter(Boolean).join(' · ')}</span></span><Check className="size-4 text-primary" /></button>) : <p className="p-4 text-center text-sm text-muted-foreground">No matching customers.</p>}</div>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" onClick={() => setNewOpen(true)}><Plus className="mr-1 size-4" />New</Button>
    </div>
    <Dialog open={newOpen} onOpenChange={setNewOpen}><DialogContent><DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Customer name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><Input placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /><Input placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /><Input placeholder="State" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} /><Input className="sm:col-span-2" placeholder="Billing address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /><Input className="sm:col-span-2" placeholder="GSTIN" value={draft.gstin} onChange={(e) => setDraft({ ...draft, gstin: e.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button><Button type="button" disabled={saving || !draft.name.trim()} onClick={() => void saveCustomer()}>{saving ? 'Saving…' : 'Add customer'}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
