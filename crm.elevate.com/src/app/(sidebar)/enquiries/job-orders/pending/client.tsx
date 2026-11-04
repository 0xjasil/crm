'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer, PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import {
  Search,
  Filter,
  Eye,
  Trash2,
  MoreHorizontal,
  Briefcase,
  UserPlus
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { getJobOrders, deleteJobOrder, reassignJobOrder } from '@/server/actions/job-order';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Progress } from '@/components/ui/progress';
import { JobOrderMobileCard } from '@/components/enquiry/job-order-mobile-card';

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
  createadAt: Date;
  manager: {
    id: string;
    name: string;
    email: string;
  };
  branch: {
    id: string;
    name: string;
  };
  progress: number;
  assigner?: {
    id: string;
    name: string;
  };
  _count?: {
    jobLeads: number;
  };
}

interface PendingJobOrdersClientProps {
  userRole: string;
  userId: string;
  branches?: { id: string; name: string }[];
  availableManagers?: { id: string; name: string; email: string }[];
}

export default function PendingJobOrdersClient({
  userRole,
  userId,
  branches = [],
  availableManagers = []
}: PendingJobOrdersClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for Re-assign Dialog
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [jobToReassign, setJobToReassign] = useState<string | null>(null);
  const [newManagerId, setNewManagerId] = useState<string>('');

  // Fetch job orders
  const fetchJobOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getJobOrders({
        page: currentPage,
        limit: 10,
        pendingOnly: true,
        branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
        search: search,
      });

      if (result.success) {
        const data = (result.data as JobOrder[]) || [];
        setJobOrders(data);
        setPagination(result.pagination || null);
      } else {
        toast.error(result.message || 'Failed to fetch job orders');
      }
    } catch {
      toast.error('Failed to fetch job orders');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedBranch, search]);

  useEffect(() => {
    fetchJobOrders();
  }, [fetchJobOrders]);

  const handleViewJobOrder = (jobOrderId: string) => {
    router.push(`/enquiries/job-orders/${jobOrderId}`);
  };

  const handleDeleteJobOrder = async (jobOrderId: string) => {
    if (!confirm('Are you sure you want to delete this job order?')) return;

    try {
      const result = await deleteJobOrder(jobOrderId);
      if (result.success) {
        toast.success('Job order deleted successfully');
        fetchJobOrders();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to delete job order');
    }
  };

  const openReassignDialog = (jobOrderId: string) => {
    setJobToReassign(jobOrderId);
    setNewManagerId('');
    setIsReassignOpen(true);
  }

  const handleReassign = async () => {
    if (!jobToReassign || !newManagerId) {
      toast.error('Please select a manager');
      return;
    }

    try {
      const result = await reassignJobOrder(jobToReassign, newManagerId);
      if (result.success) {
        toast.success('Job order re-assigned successfully');
        setIsReassignOpen(false);
        fetchJobOrders();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to re-assign job order');
    }
  };


  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Permission Checks
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'executive';

  // Columns: Job ID, Job Name, Counselor (Manager), Date Period, Progress, Remarks, Actions

  return (
    <PageContainer>
      <PageHeader
        title="Job Orders"
        description="Track pending job orders, lead progress, and team assignment across all branches"
      />

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job name or ID..."
            className="pl-9 h-9 text-xs bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isAdmin && (
          <div className="w-full sm:w-[200px]">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Job Orders Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Job Orders {pagination?.total ? `(${pagination.total})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredJobOrdersTable(isLoading, jobOrders, isMobile, pagination, isAdmin, isManager, handleViewJobOrder, handleDeleteJobOrder, formatDate)}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function filteredJobOrdersTable(
  isLoading: boolean,
  jobOrders: JobOrder[],
  isMobile: boolean,
  pagination: any,
  isAdmin: boolean,
  isManager: boolean,
  handleViewJobOrder: (id: string) => void,
  handleDeleteJobOrder: (id: string) => void,
  formatDate: (d: any) => string
) {
  if (isLoading && jobOrders.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Loading job orders...</p>
      </div>
    );
  }

  if (jobOrders.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No records found</div>;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3 p-3 sm:p-4">
        {jobOrders.map((job) => (
          <JobOrderMobileCard
            key={job.id}
            jobOrder={job}
            onView={handleViewJobOrder}
            onDelete={handleDeleteJobOrder}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Job ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Job Name</TableHead>
                <TableHead className="w-[70px]">Leads</TableHead>
                <TableHead>Counselor</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Date Period</TableHead>
                <TableHead className="w-[120px]">Progress</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobOrders.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => handleViewJobOrder(job.id)}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">#{job.id.slice(-6)}</TableCell>
                  <TableCell className="text-xs">{job.branch.name}</TableCell>
                  <TableCell className="font-medium text-xs">{job.name}</TableCell>
                  <TableCell className="text-xs">{job._count?.jobLeads || 0}</TableCell>
                  <TableCell className="text-xs">{job.manager.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{job.assigner?.name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(job.startDate)} — {formatDate(job.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="w-[60px]" />
                      <span className="text-xs font-medium tabular-nums">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{job.remarks || '—'}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewJobOrder(job.id)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>

                      {(isAdmin) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this job order?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the job order
                                and remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteJobOrder(job.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  );
}

