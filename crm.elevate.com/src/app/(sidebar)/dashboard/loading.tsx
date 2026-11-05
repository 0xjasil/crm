import { PageContainer } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <PageContainer className="min-w-0" role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard...</span>
      <div aria-hidden="true" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
