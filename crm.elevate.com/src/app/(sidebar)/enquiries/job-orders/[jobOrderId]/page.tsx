'use client';

import { useState, useEffect, useCallback, use, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Briefcase,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Eye,
  Zap,
} from 'lucide-react';
import { getJobOrder, updateJobLeadStatus, getJobOrderStats } from '@/server/actions/job-order';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { IconBrandWhatsapp } from '@tabler/icons-react';

interface JobLead {
  id: string;
  status: 'PENDING' | 'CLOSED';
  lead: {
    id: string;
    candidateName: string;
    phone: string;
    contact2: string | null;
    email: string | null;
    status: string;
    address: string | null;
    notes: string | null;
    feedback: string | null;
    lastContactDate: Date | null;
    createdAt: Date;
    preferredCourse: { id: string; name: string } | null;
    enquirySource:   { id: string; name: string } | null;
    requiredService: { id: string; name: string } | null;
    assignedTo:      { id: string; name: string } | null;
  };
}

interface JobOrder {
  id: string;
  name: string;
  description?: string | null;
  remarks?: string | null;
  jobCode?: string | null;
  managerId: string;
  branchId: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  manager: { id: string; name: string; email: string; role: string };
  branch: { id: string; name: string; address: string | null; phone: string | null; email: string | null };
  jobLeads: JobLead[];
}

// ── Mobile lead card ──────────────────────────────────────────────────────────
function JobLeadMobileCard({
  jobLead,
  jobOrderId,
  isUpdating,
  onStatusChange,
  onView,
}: {
  jobLead: JobLead;
  jobOrderId: string;
  isUpdating: boolean;
  onStatusChange: (id: string, current: 'PENDING' | 'CLOSED') => void;
  onView: (leadId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lead = jobLead.lead;
  const isClosed = jobLead.status === 'CLOSED';

  return (
    <Card className={cn(
      'w-full border-border/80 shadow-xs transition-colors',
      isClosed && 'opacity-70'
    )}>
      <CardContent className="p-3.5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={lead.status} size="sm" />
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4 border',
                  isClosed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
                )}
              >
                {isClosed ? 'Closed' : 'Pending'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
              {lead.candidateName}
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{lead.phone}</p>
          </div>

          {/* Contact + menu */}
          <div className="flex items-center gap-1 shrink-0">
            <a href={`tel:${lead.phone}`}>
              <Button size="icon" variant="outline"
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                title="Call">
                <Phone className="size-3.5" />
              </Button>
            </a>
            <a href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="outline"
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                title="WhatsApp">
                <IconBrandWhatsapp className="size-3.5" />
              </Button>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                  <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onView(jobLead.id)}>
                  <Eye className="mr-2 size-3.5" />
                  View Lead Details
                </DropdownMenuItem>
                {!isClosed && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStatusChange(jobLead.id, jobLead.status)}
                      className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                    >
                      <CheckCircle className="mr-2 size-3.5" />
                      Mark as Closed
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          {lead.preferredCourse && (
            <div className="flex items-center gap-1.5 col-span-2 truncate">
              <Zap className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="font-medium text-foreground truncate">{lead.preferredCourse.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px]">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
          </div>
          {lead.lastContactDate ? (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="text-[11px]">{format(new Date(lead.lastContactDate), 'MMM dd, yyyy')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] italic">
              <Clock className="size-3.5 text-muted-foreground/70 shrink-0" />
              Never contacted
            </div>
          )}
        </div>

        {/* Expandable notes/feedback */}
        {(lead.notes || lead.feedback || lead.address) && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[11px] text-muted-foreground gap-1.5 border border-border/50 rounded-md"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? 'Hide details' : 'Show notes & details'}
            </Button>

            {expanded && (
              <div className="space-y-2.5 pt-0.5 animate-in slide-in-from-top-1 duration-150">
                {lead.notes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3" /> Notes
                    </p>
                    <p className="text-xs text-foreground/90 bg-muted/40 rounded-md p-2.5 leading-relaxed whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                )}
                {lead.feedback && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3" /> Feedback
                    </p>
                    <p className="text-xs text-foreground/90 bg-muted/40 rounded-md p-2.5 leading-relaxed whitespace-pre-wrap">
                      {lead.feedback}
                    </p>
                  </div>
                )}
                {lead.address && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3" /> Address
                    </p>
                    <p className="text-xs text-foreground/90 bg-muted/40 rounded-md p-2.5 leading-relaxed">
                      {lead.address}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JobOrderDetailPage({ params }: { params: Promise<{ jobOrderId: string }> }) {
  const { jobOrderId } = use(params);
  const router = useRouter();
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [stats, setStats] = useState<{ percentage: number; closed: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchJobOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orderResult, statsResult] = await Promise.all([
        getJobOrder(jobOrderId),
        getJobOrderStats(jobOrderId),
      ]);
      if (orderResult.success) {
        setJobOrder(orderResult.data as JobOrder);
      } else {
        toast.error(orderResult.message || 'Failed to fetch job order details');
        router.push('/enquiries/job-orders');
      }
      if (statsResult.success && statsResult.data) setStats(statsResult.data);
    } catch {
      toast.error('An error occurred while fetching job order details');
    } finally {
      setIsLoading(false);
    }
  }, [jobOrderId, router]);

  useEffect(() => { fetchJobOrder(); }, [fetchJobOrder]);

  const handleStatusChange = async (leadId: string, currentStatus: 'PENDING' | 'CLOSED') => {
    const newStatus = currentStatus === 'PENDING' ? 'CLOSED' : 'PENDING';
    setUpdatingLeadId(leadId);
    try {
      const result = await updateJobLeadStatus(leadId, newStatus);
      if (result.success) {
        toast.success(`Lead marked as ${newStatus.toLowerCase()}`);
        setJobOrder((prev) =>
          prev ? { ...prev, jobLeads: prev.jobLeads.map((jl) => jl.id === leadId ? { ...jl, status: newStatus } : jl) } : null
        );
        const statsResult = await getJobOrderStats(jobOrderId);
        if (statsResult.success && statsResult.data) setStats(statsResult.data);
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleViewLead = (leadId: string) => {
    router.push(`/enquiries/job-orders/${jobOrderId}/leads/${leadId}`);
  };

  const toggleRow = (leadId: string) => {
    const next = new Set(expandedRows);
    next.has(leadId) ? next.delete(leadId) : next.add(leadId);
    setExpandedRows(next);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading job order...</p>
        </div>
      </div>
    );
  }

  if (!jobOrder) return null;

  const pendingCount = stats ? stats.total - stats.closed : 0;
  const closedCount  = stats?.closed  ?? 0;
  const totalLeads   = stats?.total   ?? 0;
  const progress     = stats?.percentage ?? 0;
  const isComplete   = pendingCount === 0 && totalLeads > 0;

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:p-6 max-w-[1150px] w-full mx-auto">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 md:-mx-6 md:-mt-6 bg-background border-b border-border/80 px-3 py-2.5 sm:px-4 flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-semibold text-sm sm:text-base text-foreground truncate leading-tight">
              {jobOrder.name}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 h-4 border shrink-0',
                isComplete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
              )}
            >
              {isComplete ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {jobOrder.branch.name} · {jobOrder.manager.name}
          </p>
        </div>

        {/* Progress pill */}
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <span className={cn(
            'text-xs font-bold tabular-nums',
            progress >= 80 ? 'text-emerald-600 dark:text-emerald-400'
              : progress >= 40 ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
          )}>
            {Math.round(progress)}%
          </span>
          <Progress value={progress} className="w-16 h-1.5" />
        </div>
      </div>

      {/* ── Stat pills ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: totalLeads, icon: Users,       color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/50' },
          { label: 'Pending',value: pendingCount, icon: Clock,    color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/50' },
          { label: 'Closed', value: closedCount,  icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'Days Left', value: Math.max(0, Math.ceil((new Date(jobOrder.endDate).getTime() - Date.now()) / 86400000)), icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('rounded-xl border border-border/60 p-2.5 sm:p-3 flex flex-col items-center gap-1 text-center', bg)}>
            <Icon className={cn('size-3.5 sm:size-4', color)} />
            <p className={cn('font-bold text-base sm:text-lg leading-none tabular-nums', color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Job meta card ───────────────────────────────────────────────── */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Managed by</span>
              <span className="font-medium text-foreground ml-0.5">{jobOrder.manager.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium text-foreground ml-0.5">{jobOrder.branch.name}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium text-foreground ml-0.5">
                {format(new Date(jobOrder.startDate), 'MMM dd, yyyy')} — {format(new Date(jobOrder.endDate), 'MMM dd, yyyy')}
              </span>
            </div>
            {jobOrder.description && (
              <div className="sm:col-span-2 text-muted-foreground leading-relaxed">{jobOrder.description}</div>
            )}
            {jobOrder.remarks && (
              <div className="sm:col-span-2 text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Remarks: </span>{jobOrder.remarks}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Leads list ──────────────────────────────────────────────────── */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Job Leads ({totalLeads})
          </CardTitle>
          {totalLeads > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{closedCount} closed</span>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingCount} pending</span>
            </div>
          )}
        </CardHeader>

        {jobOrder.jobLeads.length === 0 ? (
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-muted p-3">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No leads assigned</p>
                <p className="text-xs text-muted-foreground mt-1">No candidates have been added to this job order yet.</p>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="block md:hidden p-3 sm:p-4 space-y-3">
              {jobOrder.jobLeads.map((jobLead) => (
                <JobLeadMobileCard
                  key={jobLead.id}
                  jobLead={jobLead}
                  jobOrderId={jobOrderId}
                  isUpdating={updatingLeadId === jobLead.id}
                  onStatusChange={handleStatusChange}
                  onView={handleViewLead}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Candidate</TableHead>
                    <TableHead className="w-[110px]">Created</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Capacity / Source</TableHead>
                    <TableHead className="w-[120px]">Last Contact</TableHead>
                    <TableHead className="w-[100px]">Lead Status</TableHead>
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobOrder.jobLeads.map((jobLead) => (
                    <Fragment key={jobLead.id}>
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRow(jobLead.id)}>
                            {expandedRows.has(jobLead.id)
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-foreground">{jobLead.lead.candidateName}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <StatusBadge status={jobLead.lead.status} size="sm" />
                            {jobLead.lead.assignedTo && (
                              <span className="text-[10px] text-muted-foreground">({jobLead.lead.assignedTo.name})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(jobLead.lead.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-foreground/80">
                              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                              {jobLead.lead.phone}
                            </div>
                            {jobLead.lead.contact2 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                                <Phone className="h-3 w-3 shrink-0" />
                                {jobLead.lead.contact2}
                              </div>
                            )}
                            {jobLead.lead.email && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[140px]">{jobLead.lead.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {jobLead.lead.preferredCourse ? (
                              <div className="text-xs font-medium text-foreground">{jobLead.lead.preferredCourse.name}</div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                            {jobLead.lead.requiredService && (
                              <div className="text-[11px] text-muted-foreground">{jobLead.lead.requiredService.name}</div>
                            )}
                            {jobLead.lead.enquirySource && (
                              <div className="text-[11px] text-muted-foreground">via {jobLead.lead.enquirySource.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {jobLead.lead.lastContactDate
                            ? format(new Date(jobLead.lead.lastContactDate), 'MMM dd, yyyy')
                            : <span className="italic text-[11px]">Never</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-5',
                              jobLead.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                            )}
                          >
                            {jobLead.status === 'PENDING' ? 'Pending' : 'Closed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingLeadId === jobLead.id}>
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs w-44">
                              <DropdownMenuItem onClick={() => handleViewLead(jobLead.id)}>
                                <FileText className="mr-2 h-3.5 w-3.5" />
                                View Lead Details
                              </DropdownMenuItem>
                              {jobLead.status === 'PENDING' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(jobLead.id, 'PENDING')}
                                    className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                                  >
                                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                    Mark as Closed
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row */}
                      {expandedRows.has(jobLead.id) && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={8} className="p-0 border-b">
                            <div className="px-6 py-4 pl-14 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-2 duration-150">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                    <MessageSquare className="size-3" /> Notes
                                  </p>
                                  <div className="bg-background border border-border/60 rounded-lg p-3 text-xs min-h-[60px]">
                                    {jobLead.lead.notes
                                      ? <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{jobLead.lead.notes}</p>
                                      : <span className="text-muted-foreground italic">No notes recorded.</span>}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                    <MessageSquare className="size-3" /> Feedback
                                  </p>
                                  <div className="bg-background border border-border/60 rounded-lg p-3 text-xs min-h-[60px]">
                                    {jobLead.lead.feedback
                                      ? <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{jobLead.lead.feedback}</p>
                                      : <span className="text-muted-foreground italic">No feedback recorded.</span>}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                  <MapPin className="size-3" /> Address & Meta
                                </p>
                                <div className="bg-background border border-border/60 rounded-lg p-3 text-xs space-y-2.5">
                                  <p className={cn(jobLead.lead.address ? 'text-foreground/90' : 'text-muted-foreground italic')}>
                                    {jobLead.lead.address ?? 'No address provided.'}
                                  </p>
                                  <Separator className="my-1" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-muted-foreground">Assignee: </span>
                                      <span className="font-medium">{jobLead.lead.assignedTo?.name ?? 'Unassigned'}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Created: </span>
                                      <span className="font-medium">{format(new Date(jobLead.lead.createdAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
