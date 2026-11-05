'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Trash2 } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/ui/page-header';
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
import { getJobOrders, deleteJobOrder } from '@/server/actions/job-order';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

interface CompletedJobOrdersClientProps {
  userRole: string;
  userId: string;
  branches?: { id: string; name: string }[];
  availableManagers?: { id: string; name: string; email: string }[];
}

export default function CompletedJobOrdersClient({ 
  userRole, 
  branches = []
}: CompletedJobOrdersClientProps) {
  const router = useRouter();
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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch job orders
  const fetchJobOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getJobOrders({
        page: currentPage,
        limit: 10,
        completedOnly: true, // Fetch only completed jobs
        pendingOnly: false,
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

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Permission Checks
  const isAdmin = userRole === 'admin';
  
  return (
    <PageContainer className="min-w-0">
      <PageHeader title="Completed Jobs List" description="View and manage completed jobs" />
      <div className="@container/main min-w-0 space-y-4 sm:space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Branch Filter (Admin Only) */}
          {isAdmin && (
             <div className="flex min-w-0 flex-col gap-2">
                 <label htmlFor="completed-branch" className="text-sm font-medium">Branch</label>
                 <Select value={selectedBranch} onValueChange={(value) => { setSelectedBranch(value); setCurrentPage(1); }}>
                   <SelectTrigger id="completed-branch" className="w-full min-w-0">
                     <SelectValue placeholder="All Branch" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Branch</SelectItem>
                     {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
             </div>
          )}
          {/* Search */}
          <div className={`flex min-w-0 flex-col gap-2 ${isAdmin ? '' : 'sm:col-span-2'}`}>
             <label htmlFor="completed-search" className="text-sm font-medium">Search</label>
             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="completed-search"
                  placeholder="Search completed jobs..."
                  className="w-full min-w-0 pl-8"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
             </div>
          </div>
      </div>

      {/* Job Orders Table */}
      <Card className="min-w-0 overflow-hidden py-0">
        <CardContent className="p-0">
          {filteredJobOrdersTable(isLoading, jobOrders, isAdmin, handleViewJobOrder, handleDeleteJobOrder, formatDate)}
        </CardContent>
      </Card>
      {pagination && pagination.pages > 0 && <nav aria-label="Completed jobs pagination" className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground" aria-live="polite">Page {pagination.page} of {pagination.pages} / {pagination.total} jobs</p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" disabled={isLoading || currentPage <= 1} onClick={() => setCurrentPage(page => page - 1)}>Previous</Button>
          <Button variant="outline" disabled={isLoading || currentPage >= pagination.pages} onClick={() => setCurrentPage(page => page + 1)}>Next</Button>
        </div>
      </nav>}
      </div>
    </PageContainer>
  );
}

function filteredJobOrdersTable(
    isLoading: boolean,
    jobOrders: JobOrder[],
    isAdmin: boolean,
    handleViewJobOrder: (id: string) => void,
    handleDeleteJobOrder: (id: string) => void,
    formatDate: (d: Date | string) => string
) {

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (jobOrders.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No records found</div>;
    }
  
    return (
        <>
             {/* Mobile Card View */}
             <div className="grid min-w-0 grid-cols-1 gap-3 p-3 @[560px]/main:grid-cols-2 @[960px]/main:hidden sm:p-4">
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
             <div className="hidden min-w-0 @[960px]/main:block">
                    <Table className="table-fixed text-xs">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[7%] whitespace-normal px-2">Job ID</TableHead>
                                <TableHead className="w-[10%] whitespace-normal px-2">Branch</TableHead>
                                <TableHead className="w-[15%] whitespace-normal px-2">Job Name</TableHead>
                                <TableHead className="w-[5%] whitespace-normal px-2">Leads</TableHead>
                                <TableHead className="w-[10%] whitespace-normal px-2">Counselor</TableHead>
                                <TableHead className="w-[10%] whitespace-normal px-2">Assigned By</TableHead>
                                <TableHead className="w-[13%] whitespace-normal px-2">Date Period</TableHead>
                                <TableHead className="w-[10%] whitespace-normal px-2">Progress</TableHead>
                                <TableHead className="w-[10%] whitespace-normal px-2">Remarks</TableHead>
                                <TableHead className="w-[10%] px-2 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobOrders.map((job) => (
                                <TableRow key={job.id} className="[&>td]:whitespace-normal [&>td]:break-words [&>td]:px-2 [&>td]:align-top">
                                    <TableCell>{job.id.slice(-6)}</TableCell>
                                    <TableCell>{job.branch.name}</TableCell>
                                    <TableCell className="font-medium [overflow-wrap:anywhere]">{job.name}</TableCell>
                                    <TableCell>{job._count?.jobLeads || 0}</TableCell>
                                    <TableCell>{job.manager.name}</TableCell>
                                    <TableCell>{job.assigner?.name || '-'}</TableCell>
                                    <TableCell>
                                        <span className="block">{formatDate(job.startDate)}</span><span className="block text-muted-foreground">to {formatDate(job.endDate)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <Progress value={job.progress} className="w-[60px]" />
                                            <span className="text-xs">{job.progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{job.remarks || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label={`View ${job.name}`} onClick={() => handleViewJobOrder(job.id)}>
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            
                                            {(isAdmin) && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label={`Delete ${job.name}`}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the job order
                                                                and remove all associated data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteJobOrder(job.id)} className="bg-red-600 hover:bg-red-700">
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
        </>
    );
}

