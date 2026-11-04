'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Building,
  GraduationCap,
  MessageSquare,
  PhoneCall,
  CalendarPlus,
  ArrowLeft,
  UserPlus,
  MapPin,
  MessageCircle,
  Star,
  Activity,
  Edit2,
  ArrowUpCircle,
  FileText,
  Zap,
  ClipboardList,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { fetchEnquiry as fetchEnquiryRequest } from '@/lib/api/enquiry-api';
import { createFollowUp } from '@/server/actions/follow-up';
import { createCallLog } from '@/server/actions/call-log';
import { getEnquiryActivities } from '@/server/actions/enquiry-activity-actions';
import { ENQUIRY_STATUS_OPTIONS } from '@/constants/enquiry';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { EnquiryStatus, Enquiry, FollowUp, CallLog } from '@/types/enquiry';
import { EnquiryActivity, ActivityType } from '@/types/enquiry-activity';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAction } from 'next-safe-action/hooks';
import { authClient } from '@/lib/auth-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { IconBrandWhatsapp } from '@tabler/icons-react';

const EnquiryFormDialog = dynamic(
  () => import('@/components/enquiry/enquiry-form-dialog').then((mod) => mod.EnquiryFormDialog),
  { ssr: false }
);
const AssignEnquiryDialog = dynamic(
  () => import('@/components/enquiry/assign-enquiry-dialog').then((mod) => mod.AssignEnquiryDialog),
  { ssr: false }
);
const StatusUpdateDialog = dynamic(
  () => import('@/components/enquiry/status-update-dialog').then((mod) => mod.StatusUpdateDialog),
  { ssr: false }
);

// Form schemas
const followUpSchema = z.object({
  scheduledAt: z.date({ required_error: 'A date and time is required.' }),
  notes: z.string().max(1000).optional(),
});

const callLogSchema = z.object({
  duration: z.number().min(0).optional(),
  outcome: z.string().min(1, 'Call outcome is required').max(500),
  notes: z.string().max(1000).optional(),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;
type CallLogFormData = z.infer<typeof callLogSchema>;

// ─── small helper ───────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
  action,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-3.5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
            {label}
          </p>
          <p className={cn('text-sm text-foreground truncate', mono && 'font-mono')}>
            {value}
          </p>
        </div>
      </div>
      {action && <div className="shrink-0 flex gap-1">{action}</div>}
    </div>
  );
}

export default function EnquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params.id as string;
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role?.toLowerCase();
  const canAssign = userRole === 'admin' || userRole === 'manager';

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [activities, setActivities] = useState<EnquiryActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);
  const [isCreatingCallLog, setIsCreatingCallLog] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [isCallLogDialogOpen, setIsCallLogDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [fixedBranchId, setFixedBranchId] = useState('');
  const [fixedBranchName, setFixedBranchName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  const {
    execute: fetchActivities,
    result: activitiesResult,
    isExecuting: isFetchingActivities,
  } = useAction(getEnquiryActivities);

  const followUpForm = useForm<FollowUpFormData>({ resolver: zodResolver(followUpSchema) });
  const callLogForm = useForm<CallLogFormData>({ resolver: zodResolver(callLogSchema) });

  const fetchEnquiry = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchEnquiryRequest(enquiryId);
      if (result.success) {
        setEnquiry(result.data as Enquiry);
      } else {
        toast.error(result.message || 'Failed to fetch enquiry');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch enquiry');
    } finally {
      setIsLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    if (enquiry?.branch?.id) {
      setFixedBranchId(enquiry.branch.id);
      setFixedBranchName(enquiry.branch.name);
    }
  }, [enquiry?.branch?.id, enquiry?.branch?.name]);

  const loadActivities = useCallback(async () => {
    if (!enquiryId) return;
    setIsLoadingActivities(true);
    try {
      await fetchActivities({ enquiryId, page: 1, limit: 100, type: undefined });
    } catch {
      toast.error('Failed to load activities');
    } finally {
      setIsLoadingActivities(false);
    }
  }, [enquiryId, fetchActivities]);

  useEffect(() => {
    if (activitiesResult?.data?.success) {
      setActivities((activitiesResult.data.data || []) as EnquiryActivity[]);
    } else if (activitiesResult?.serverError) {
      toast.error(`Error loading activities: ${activitiesResult.serverError}`);
    }
  }, [activitiesResult]);

  useEffect(() => {
    if (enquiryId) fetchEnquiry();
  }, [enquiryId, fetchEnquiry]);

  useEffect(() => {
    if (activeTab === 'activity' && !activitiesLoaded && enquiryId) {
      loadActivities();
      setActivitiesLoaded(true);
    }
  }, [activeTab, activitiesLoaded, enquiryId, loadActivities]);

  const handleStatusUpdateSuccess = useCallback(() => {
    fetchEnquiry();
    if (activitiesLoaded) loadActivities();
  }, [fetchEnquiry, activitiesLoaded, loadActivities]);

  const handleCreateFollowUp = async (data: FollowUpFormData) => {
    setIsCreatingFollowUp(true);
    try {
      const result = await createFollowUp({ enquiryId, scheduledAt: data.scheduledAt, notes: data.notes });
      if (result.success) {
        toast.success(result.message);
        setIsFollowUpDialogOpen(false);
        followUpForm.reset();
        handleStatusUpdateSuccess();
      } else {
        toast.error(result.message || 'Failed to create follow-up');
      }
    } catch {
      toast.error('Failed to create follow-up');
    } finally {
      setIsCreatingFollowUp(false);
    }
  };

  const handleCreateCallLog = async (data: CallLogFormData) => {
    setIsCreatingCallLog(true);
    try {
      const result = await createCallLog({ enquiryId, duration: data.duration, outcome: data.outcome, notes: data.notes });
      if (result.success) {
        toast.success(result.message);
        setIsCallLogDialogOpen(false);
        callLogForm.reset();
        handleStatusUpdateSuccess();
      } else {
        toast.error(result.message || 'Failed to create call log');
      }
    } catch {
      toast.error('Failed to create call log');
    } finally {
      setIsCreatingCallLog(false);
    }
  };

  const formatDate = (dateString: string | Date) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatDateTime = (dateString: string | Date) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const calculateDaysInPipeline = (createdAt: string | Date) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // ── Timeline helpers ──────────────────────────────────────────────────────
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.STATUS_CHANGE: return ArrowUpCircle;
      case ActivityType.FOLLOW_UP: return CalendarIcon;
      case ActivityType.CALL_LOG: return PhoneCall;
      case ActivityType.ENROLLMENT_DIRECT: return GraduationCap;
      default: return Activity;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.STATUS_CHANGE: return 'blue';
      case ActivityType.FOLLOW_UP: return 'green';
      case ActivityType.CALL_LOG: return 'purple';
      case ActivityType.ENROLLMENT_DIRECT: return 'amber';
      default: return 'gray';
    }
  };

  const getActivityTitle = (activity: EnquiryActivity) => {
    if (activity.title) return activity.title;
    switch (activity.type) {
      case ActivityType.STATUS_CHANGE: return `Status changed to ${activity.newStatus}`;
      case ActivityType.FOLLOW_UP: return 'Follow-up created';
      case ActivityType.CALL_LOG: return 'Call logged';
      case ActivityType.ENROLLMENT_DIRECT: return 'Direct enrollment completed';
      default: return 'Activity recorded';
    }
  };

  type TimelineItem = {
    id: string;
    type: 'activity' | 'followup' | 'calllog';
    data: EnquiryActivity | FollowUp | CallLog;
    createdAt: string | Date;
  };

  const getAllActivities = (): TimelineItem[] => {
    const allItems: TimelineItem[] = activities.map((a) => ({
      id: `activity-${a.id}`,
      type: 'activity' as const,
      data: a,
      createdAt: a.createdAt,
    }));

    if (enquiry?.followUps) {
      enquiry.followUps.forEach((followUp) => {
        if (!activities.some((a) => a.followUpId === followUp.id)) {
          allItems.push({ id: `followup-${followUp.id}`, type: 'followup', data: followUp, createdAt: followUp.createdAt });
        }
      });
    }
    if (enquiry?.callLogs) {
      enquiry.callLogs.forEach((callLog) => {
        if (!activities.some((a) => a.callLogId === callLog.id)) {
          allItems.push({ id: `calllog-${callLog.id}`, type: 'calllog', data: callLog, createdAt: callLog.createdAt });
        }
      });
    }

    return allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // ── Loading / Not Found ───────────────────────────────────────────────────
  if (!enquiry) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading enquiry...</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="font-medium text-foreground">Enquiry not found</p>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Go Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  const ksebMatch = enquiry.notes?.match(/\[(?:Avg\.\s*)?KSEB Bill:\s*([^\]]+)\]/i);
  const ksebVal = ksebMatch ? ksebMatch[1] : null;

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Compact Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/80 px-3 py-2.5 flex items-center gap-2.5 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-semibold text-sm sm:text-base text-foreground truncate leading-tight">
              {enquiry.candidateName}
            </h1>
            <StatusBadge status={enquiry.status} size="sm" />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{enquiry.phone}</p>
        </div>

        {/* Header contact actions — always visible */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`tel:${enquiry.phone}`}>
            <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50" title="Call">
              <Phone className="size-3.5" />
            </Button>
          </Link>
          <Link href={`https://wa.me/91${enquiry.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
            <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50" title="WhatsApp">
              <IconBrandWhatsapp className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Page Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-1.5 sm:gap-4 sm:p-4 md:p-6 max-w-[1150px] w-full mx-auto">

        {/* ── Stat Pills ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Days', value: calculateDaysInPipeline(enquiry.createdAt), icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
            { label: 'Follow-ups', value: enquiry.followUps?.length ?? 0, icon: CalendarIcon, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
            { label: 'Calls', value: enquiry.callLogs?.length ?? 0, icon: PhoneCall, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
            { label: 'Last Contact', value: enquiry.lastContactDate ? formatDate(enquiry.lastContactDate) : 'Never', icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', small: true },
          ].map(({ label, value, icon: Icon, color, bg, small }) => (
            <div key={label} className={cn('rounded-xl border border-border/60 p-2.5 sm:p-3 flex flex-col items-center gap-1 text-center', bg)}>
              <Icon className={cn('size-3.5 sm:size-4', color)} />
              <p className={cn('font-bold leading-none', small ? 'text-[10px] sm:text-xs' : 'text-base sm:text-lg', color)}>
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Primary Telecaller Actions ───────────────────────────────── */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Quick Actions
            </p>
            {/* Row 1: most-used by telecallers */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                variant="default"
                size="sm"
                className="h-10 gap-1.5 text-xs font-medium"
                onClick={() => setIsCallLogDialogOpen(true)}
              >
                <PhoneCall className="size-3.5" />
                Log Call
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 text-xs font-medium"
                onClick={() => setIsFollowUpDialogOpen(true)}
              >
                <CalendarPlus className="size-3.5" />
                Follow-up
              </Button>

              <StatusUpdateDialog
                enquiryId={enquiry.id}
                currentStatus={enquiry.status}
                candidateName={enquiry.candidateName}
                onSuccess={handleStatusUpdateSuccess}
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                trigger={
                  <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs font-medium w-full">
                    <Edit2 className="size-3.5" />
                    Update Status
                  </Button>
                }
              />

              <Link href={`/admissions?enquiryId=${enquiry.id}`} className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-1.5 text-xs font-medium w-full"
                  onClick={() => toast.info('Taking you to the site survey form...')}
                >
                  <ClipboardList className="size-3.5" />
                  Site Survey
                </Button>
              </Link>
            </div>

            {/* Row 2: secondary actions */}
            <div className="grid grid-cols-3 gap-2 mt-2 sm:grid-cols-3">
              <EnquiryFormDialog mode="edit" enquiry={enquiry} onSuccess={fetchEnquiry} />

              {canAssign && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-medium"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  <UserPlus className="size-3.5" />
                  {enquiry.assignedTo ? 'Reassign' : 'Assign'}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium"
                onClick={() => router.push(`/proposals/create?enquiryId=${enquiry.id}`)}
              >
                <FileText className="size-3.5" />
                Proposal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="overview" className="text-xs gap-1.5">
              <UserIcon className="size-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5" onClick={() => {
              if (!activitiesLoaded) { loadActivities(); setActivitiesLoaded(true); }
            }}>
              <Activity className="size-3.5" />
              <span>Activity</span>
              {(enquiry.followUps?.length || 0) + (enquiry.callLogs?.length || 0) > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold ml-0.5">
                  {(enquiry.followUps?.length || 0) + (enquiry.callLogs?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs gap-1.5">
              <MessageSquare className="size-3.5" />
              <span>Notes</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ─────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-3 space-y-3">
            {/* Contact Card */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Phone className="size-3.5" /> Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow
                  icon={Phone}
                  label="Primary Phone"
                  value={enquiry.phone}
                  mono
                  action={
                    <>
                      <Link href={`tel:${enquiry.phone}`}>
                        <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600 dark:text-emerald-400" title="Call">
                          <Phone className="size-3" />
                        </Button>
                      </Link>
                      <Link href={`https://wa.me/91${enquiry.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600 dark:text-emerald-400" title="WhatsApp">
                          <IconBrandWhatsapp className="size-3" />
                        </Button>
                      </Link>
                    </>
                  }
                />

                {enquiry.contact2 && (
                  <InfoRow
                    icon={Phone}
                    label="Secondary Phone"
                    value={enquiry.contact2}
                    mono
                    action={
                      <>
                        <Link href={`tel:${enquiry.contact2}`}>
                          <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600 dark:text-emerald-400" title="Call">
                            <Phone className="size-3" />
                          </Button>
                        </Link>
                        <Link href={`https://wa.me/91${enquiry.contact2.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600 dark:text-emerald-400" title="WhatsApp">
                            <IconBrandWhatsapp className="size-3" />
                          </Button>
                        </Link>
                      </>
                    }
                  />
                )}

                {enquiry.email && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={enquiry.email}
                    action={
                      <Link href={`mailto:${enquiry.email}`}>
                        <Button size="icon" variant="outline" className="h-7 w-7" title="Email">
                          <Mail className="size-3" />
                        </Button>
                      </Link>
                    }
                  />
                )}

                {enquiry.address && (
                  <InfoRow icon={MapPin} label="Address" value={enquiry.address} />
                )}
              </CardContent>
            </Card>

            {/* Enquiry Details Card */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="size-3.5" /> Enquiry Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow icon={TrendingUp} label="Lead Source" value={enquiry.enquirySource?.name || (enquiry as any)?.source || 'Direct'} />
                {enquiry.branch?.name && (
                  <InfoRow icon={Building} label="Branch" value={enquiry.branch.name} />
                )}
                {enquiry.preferredCourse && (
                  <InfoRow icon={Zap} label="Required Capacity" value={enquiry.preferredCourse.name} />
                )}
                {ksebVal && (
                  <InfoRow icon={Zap} label="Avg. KSEB Bill" value={ksebVal} />
                )}
                {enquiry.requiredService && (
                  <InfoRow icon={MessageSquare} label="Required Service" value={enquiry.requiredService.name} />
                )}
                <InfoRow
                  icon={CalendarIcon}
                  label="Created"
                  value={formatDateTime(enquiry.createdAt)}
                />
                {enquiry.assignedTo && (
                  <InfoRow icon={UserIcon} label="Assigned To" value={enquiry.assignedTo.name} />
                )}
                {enquiry.assignedBy && (
                  <InfoRow icon={UserIcon} label="Assigned By" value={enquiry.assignedBy.name} />
                )}
                {enquiry.createdBy && (
                  <InfoRow icon={UserIcon} label="Created By" value={enquiry.createdBy.name} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Activity Tab ─────────────────────────────────────────── */}
          <TabsContent value="activity" className="mt-3">
            {isLoadingActivities || isFetchingActivities ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading activity...</p>
              </div>
            ) : getAllActivities().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Activity className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Log a call or schedule a follow-up to get started.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {getAllActivities().map((item) => {
                  if (item.type === 'activity') {
                    const activity = item.data as EnquiryActivity;
                    const ActivityIcon = getActivityIcon(activity.type);
                    const color = getActivityColor(activity.type);
                    const colorMap = {
                      blue: { border: 'border-blue-200 dark:border-blue-900', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
                      green: { border: 'border-emerald-200 dark:border-emerald-900', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
                      purple: { border: 'border-purple-200 dark:border-purple-900', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
                      amber: { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
                      gray: { border: 'border-border', bg: 'bg-muted/30', icon: 'bg-muted text-muted-foreground', bar: 'bg-muted-foreground' },
                    };
                    const c = colorMap[color as keyof typeof colorMap] || colorMap.gray;

                    return (
                      <div key={item.id} className={cn('relative rounded-lg border overflow-hidden', c.border, c.bg)}>
                        <div className={cn('absolute left-0 top-0 h-full w-1', c.bar)} />
                        <div className="pl-4 pr-3 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className={cn('rounded-full p-1.5 shrink-0 mt-0.5', c.icon)}>
                              <ActivityIcon className="size-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground leading-tight">
                                  {getActivityTitle(activity)}
                                </p>
                                {activity.type === ActivityType.STATUS_CHANGE && activity.newStatus && (
                                  <StatusBadge status={activity.newStatus} size="sm" />
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                by {activity.createdBy.name} · {formatDateTime(activity.createdAt)}
                              </p>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{activity.description}</p>
                              )}
                              {activity.statusRemarks && (
                                <p className="text-xs text-foreground mt-1.5 bg-background/60 rounded px-2 py-1 border border-border/50">
                                  <span className="font-medium">Remarks: </span>{activity.statusRemarks}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'followup') {
                    const followUp = item.data as FollowUp;
                    return (
                      <div key={item.id} className="relative rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                        <div className="pl-4 pr-3 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="rounded-full p-1.5 shrink-0 mt-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                              <CalendarIcon className="size-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground">Follow-up Scheduled</p>
                                <StatusBadge status={followUp.status} size="sm" />
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                for {formatDateTime(followUp.scheduledAt)} · by {followUp.createdBy.name}
                              </p>
                              {followUp.notes && <p className="text-xs text-muted-foreground mt-1.5">{followUp.notes}</p>}
                              {followUp.outcome && (
                                <p className="text-xs text-foreground mt-1.5 bg-background/60 rounded px-2 py-1 border border-border/50">
                                  <span className="font-medium">Outcome: </span>{followUp.outcome}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'calllog') {
                    const callLog = item.data as CallLog;
                    return (
                      <div key={item.id} className="relative rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-purple-500" />
                        <div className="pl-4 pr-3 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="rounded-full p-1.5 shrink-0 mt-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                              <PhoneCall className="size-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground">Call Logged</p>
                                {callLog.duration != null && callLog.duration > 0 && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {callLog.duration} min
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {formatDateTime(callLog.callDate)} · by {callLog.createdBy.name}
                              </p>
                              {callLog.outcome && (
                                <p className="text-xs text-foreground mt-1.5 bg-background/60 rounded px-2 py-1 border border-border/50">
                                  <span className="font-medium">Outcome: </span>{callLog.outcome}
                                </p>
                              )}
                              {callLog.notes && <p className="text-xs text-muted-foreground mt-1.5">{callLog.notes}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Notes Tab ────────────────────────────────────────────── */}
          <TabsContent value="notes" className="mt-3 space-y-3">
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="size-3.5" /> Enquiry Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {enquiry.notes ? (
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {enquiry.notes}
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center rounded-lg border-2 border-dashed border-border/60">
                    <MessageSquare className="size-6 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No notes have been added yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {enquiry.feedback && (
              <Card className="border-border/80 shadow-xs overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border/60 bg-amber-50/60 dark:bg-amber-950/20">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Star className="size-3.5" /> Customer Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {enquiry.feedback}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Log Call */}
      <Dialog open={isCallLogDialogOpen} onOpenChange={setIsCallLogDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="size-4 text-purple-600" />
              Log Call
            </DialogTitle>
            <DialogDescription>
              Record your call with <strong>{enquiry.candidateName}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={callLogForm.handleSubmit(handleCreateCallLog)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="outcome" className="text-xs">Call Outcome *</Label>
              <Input
                id="outcome"
                placeholder="e.g., Interested, will call back next week"
                {...callLogForm.register('outcome')}
              />
              {callLogForm.formState.errors.outcome && (
                <p className="text-xs text-destructive">{callLogForm.formState.errors.outcome.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 5"
                {...callLogForm.register('duration', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callNotes" className="text-xs">Additional Notes</Label>
              <Textarea
                id="callNotes"
                placeholder="Any additional notes..."
                className="min-h-[70px] text-sm"
                {...callLogForm.register('notes')}
              />
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCallLogDialogOpen(false)} disabled={isCreatingCallLog}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreatingCallLog} className="w-full sm:w-auto">
                {isCreatingCallLog ? 'Saving...' : 'Save Call Log'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="size-4 text-emerald-600" />
              Schedule Follow-up
            </DialogTitle>
            <DialogDescription>
              Schedule a follow-up with <strong>{enquiry.candidateName}</strong>
            </DialogDescription>
          </DialogHeader>
          <Form {...followUpForm}>
            <form onSubmit={followUpForm.handleSubmit(handleCreateFollowUp)} className="space-y-4">
              <FormField
                control={followUpForm.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full pl-3 text-left font-normal text-sm', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'MM/dd/yyyy hh:mm aa') : <span>MM/DD/YYYY hh:mm aa</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="sm:flex">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                if (!field.value) {
                                  const now = new Date();
                                  date.setHours(now.getHours());
                                  date.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
                                } else {
                                  date.setHours(field.value.getHours());
                                  date.setMinutes(field.value.getMinutes());
                                }
                                field.onChange(date);
                              }
                            }}
                            initialFocus
                          />
                          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                            <ScrollArea className="w-64 sm:w-auto">
                              <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i + 1).reverse().map((hour) => (
                                  <Button key={hour} size="icon" variant={field.value && field.value.getHours() % 12 === hour % 12 ? 'default' : 'ghost'} className="sm:w-full shrink-0 aspect-square"
                                    onClick={() => {
                                      const d = new Date(field.value || new Date());
                                      d.setHours(d.getHours() >= 12 ? hour + 12 : hour);
                                      field.onChange(d);
                                    }}>{hour}</Button>
                                ))}
                              </div>
                              <ScrollBar orientation="horizontal" className="sm:hidden" />
                            </ScrollArea>
                            <ScrollArea className="w-64 sm:w-auto">
                              <div className="flex sm:flex-col p-2">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                  <Button key={minute} size="icon" variant={field.value && field.value.getMinutes() === minute ? 'default' : 'ghost'} className="sm:w-full shrink-0 aspect-square"
                                    onClick={() => {
                                      const d = new Date(field.value || new Date());
                                      d.setMinutes(minute);
                                      field.onChange(d);
                                    }}>{minute.toString().padStart(2, '0')}</Button>
                                ))}
                              </div>
                              <ScrollBar orientation="horizontal" className="sm:hidden" />
                            </ScrollArea>
                            <ScrollArea>
                              <div className="flex sm:flex-col p-2">
                                {['AM', 'PM'].map((ampm) => (
                                  <Button key={ampm} size="icon" variant={field.value && ((ampm === 'AM' && field.value.getHours() < 12) || (ampm === 'PM' && field.value.getHours() >= 12)) ? 'default' : 'ghost'} className="sm:w-full shrink-0 aspect-square"
                                    onClick={() => {
                                      const d = new Date(field.value || new Date());
                                      const h = d.getHours();
                                      if (ampm === 'AM' && h >= 12) d.setHours(h - 12);
                                      else if (ampm === 'PM' && h < 12) d.setHours(h + 12);
                                      field.onChange(d);
                                    }}>{ampm}</Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={followUpForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reminder notes for this follow-up..." className="min-h-[70px] text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFollowUpDialogOpen(false)} disabled={isCreatingFollowUp}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isCreatingFollowUp} className="w-full sm:w-auto">
                  {isCreatingFollowUp ? 'Scheduling...' : 'Schedule Follow-up'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      {fixedBranchId && (
        <AssignEnquiryDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          enquiryId={enquiry.id}
          currentAssigneeId={enquiry.assignedTo?.id}
          candidateName={enquiry.candidateName}
          fixedBranchId={fixedBranchId}
          fixedBranchName={fixedBranchName}
          onSuccess={fetchEnquiry}
        />
      )}
    </div>
  );
}
