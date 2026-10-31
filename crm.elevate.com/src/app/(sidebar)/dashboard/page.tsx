import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/actions/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { backendRequest } from '@/lib/api/backend-server';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
import {
  IconUsers,
  IconUserPlus,
  IconClock,
  IconPhone,
  IconAlertCircle,
  IconCalendar,
  IconTarget,
  IconTrendingUp,
  IconPhoneCall,
  IconUserCheck,
  IconEye,
  IconCalendarClock,
  IconUserSearch,
  IconClockExclamation,
  IconReceipt,
  IconArrowRight,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getPositionDefinition, hasFeatureAccess } from '@/lib/permissions';
import { IconBriefcase, IconFileInvoice, IconFileDollar } from '@tabler/icons-react';

export default async function Dashboard() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error('Dashboard session error:', err);
  }

  if (!session) {
    redirect('/login');
  }

  // Get branch name if user is executive
  let branchName: string | undefined;
  if (session.user.role === 'executive' && session.user.branch) {
    try {
      const branch = await backendRequest<{ name: string } | null>('/ui/my-branch')
      branchName = branch?.name;
    } catch (e) {
      console.warn('Dashboard branch fetch warning:', e);
    }
  }

  // Get dashboard data - for telecallers, filter by their assigned enquiries
  const isTelecaller = session.user.role === 'telecaller';
  const isExecutive = session.user.role === 'executive';
  const dashboardData = await getDashboardData(
    isTelecaller ? session.user.id : undefined,
    session.user.role || undefined,
    isExecutive ? session.user.branch || undefined : undefined
  );

  const { stats, followUpStats, recentActivity, performanceMetrics } = dashboardData;

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const userPosition = getPositionDefinition(session.user.role);
  const canAccessEnquiries = hasFeatureAccess(session.user, 'enquiries');
  const canAccessJobOrders = hasFeatureAccess(session.user, 'job_orders');
  const canAccessFollowUps = hasFeatureAccess(session.user, 'follow_ups');
  const canAccessInvoices = hasFeatureAccess(session.user, 'invoices');
  const canAccessServices = hasFeatureAccess(session.user, 'services');
  const canAccessProjects = hasFeatureAccess(session.user, 'projects');
  const canAccessExpenses = hasFeatureAccess(session.user, 'expenses');
  const canAccessReports = hasFeatureAccess(session.user, 'reports');

  const primaryKpis = [
    { title: 'Total Enquiries', value: stats.totalEnquiries, indicatorColor: 'amber' as const, description: 'Shows total enquiries by status to track pipeline performance.', href: '/enquiries' },
    { title: 'New Enquiries', value: stats.newEnquiries, indicatorColor: 'emerald' as const, description: 'Fresh enquiries and leads currently being processed.', href: '/enquiries', trend: stats.newEnquiries > 0 ? { value: stats.newEnquiries, isPositive: true, label: 'new' } : undefined },
    { title: 'Pending Follow-ups', value: stats.pendingFollowUps, indicatorColor: 'slate' as const, description: 'Enquiries awaiting action, such as confirmation or callback.', href: '/follow-ups' },
    { title: 'Total Calls', value: stats.totalCalls, indicatorColor: 'purple' as const, description: 'Recorded client conversations and communication logs.', href: '/call-register' },
  ];

  const followUpKpis = [
    { title: 'Overdue Follow-ups', value: followUpStats.overdueCount, indicatorColor: 'rose' as const, description: 'Past scheduled interaction window requiring urgent attention.', href: '/follow-ups?filter=overdue' },
    { title: "Today's Follow-ups", value: followUpStats.todayCount, indicatorColor: 'amber' as const, description: 'Scheduled calls and customer follow-ups queued for today.', href: '/follow-ups?filter=today' },
    { title: 'Interested Leads', value: followUpStats.interestedLeadsCount, indicatorColor: 'emerald' as const, description: 'High-intent prospects expressing strong interest in services.', href: '/enquiries?status=INTERESTED' },
  ];

  const activityItems = [
    { icon: IconUserPlus, title: 'New Enquiries', description: (count: number) => `${count} new leads captured this week`, count: recentActivity.newEnquiries.count, badgeVariant: 'info' as const, color: 'blue' },
    { icon: IconPhoneCall, title: 'Calls Made', description: (count: number) => `${count} calls completed by team`, count: recentActivity.callsMade.count, badgeVariant: 'success' as const, color: 'emerald' },
    { icon: IconUserCheck, title: 'Enrollments', description: (count: number) => `${count} successful conversions`, count: recentActivity.enrollments.count, badgeVariant: 'warning' as const, color: 'amber' },
  ];

  const quickShortcuts = [
    { icon: IconEye, label: 'View All Enquiries', href: '/enquiries', visible: canAccessEnquiries },
    { icon: IconBriefcase, label: 'Pending Job Orders', href: '/enquiries/job-orders/pending', visible: canAccessJobOrders },
    { icon: IconCalendarClock, label: "Today's Follow-ups", href: '/follow-ups?filter=today', visible: canAccessFollowUps },
    { icon: IconFileInvoice, label: 'Invoices & Payments', href: '/invoices', visible: canAccessInvoices },
    { icon: IconFileDollar, label: 'Service Billing', href: '/services', visible: canAccessServices },
    { icon: IconUserCheck, label: 'Site Surveys & Projects', href: '/admissions', visible: canAccessProjects },
    { icon: IconTrendingUp, label: 'Analytics & Reports', href: '/reports', visible: canAccessReports },
    { icon: IconReceipt, label: 'Expense Tracker', href: '/expenses', visible: canAccessExpenses },
  ];

  const performanceKpis = [
    { title: 'Assigned Pipeline', value: performanceMetrics.totalEnquiries, indicatorColor: 'blue' as const, description: 'Total active enquiries currently in pipeline' },
    { title: 'Interest Rate', value: `${performanceMetrics.interestRate}%`, indicatorColor: 'emerald' as const, description: 'High-intent prospects showing interest' },
    { title: 'Conversion Rate', value: `${performanceMetrics.conversionRate}%`, indicatorColor: 'amber' as const, description: 'Completed admissions and closed orders' },
    { title: 'Calls Logged', value: performanceMetrics.totalCalls, indicatorColor: 'purple' as const, description: 'Total call sessions recorded in register' },
  ];

  // Header action: show the first available primary action based on permission priority
  const primaryHeaderAction = [
    { icon: IconUsers, label: 'View Enquiries', href: '/enquiries', visible: canAccessEnquiries },
    { icon: IconBriefcase, label: 'Job Orders', href: '/enquiries/job-orders/pending', visible: canAccessJobOrders },
    { icon: IconFileInvoice, label: 'Invoices', href: '/invoices', visible: canAccessInvoices },
    { icon: IconFileDollar, label: 'Service Billing', href: '/services', visible: canAccessServices },
  ].find((action) => action.visible);

  const activityColorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  };

  return (
    <PageContainer>
      {/* Top Welcome Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name || 'User'} • Session started ${formattedDate}`}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold uppercase tracking-wider text-[10px]">
              {userPosition.title}
            </Badge>
            {session.user.branch && (
              <Badge variant="outline" className="text-[11px]">
                {branchName || 'Branch User'}
              </Badge>
            )}
          </div>
        }
        actions={
          <>
            {canAccessFollowUps && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/follow-ups">
                  <IconCalendarClock className="mr-1.5 h-4 w-4" />
                  Follow-ups
                </Link>
              </Button>
            )}
            {primaryHeaderAction && (
              <Button size="sm" asChild>
                <Link href={primaryHeaderAction.href}>
                  <primaryHeaderAction.icon className="mr-1.5 h-4 w-4" />
                  {primaryHeaderAction.label}
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryKpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Follow-up Priority Queues */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {followUpKpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Activity & Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Activity Overview (Last 7 Days)</CardTitle>
            </div>
            <CardDescription className="text-xs">Summary of weekly engagement and throughput</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityItems.map((item) => (
              <div key={item.title} className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${activityColorMap[item.color]}`}>
                    <item.icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description(item.count)}</p>
                  </div>
                </div>
                <Badge variant={item.badgeVariant} className="text-xs font-semibold">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions Shortcuts */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Quick Shortcuts</CardTitle>
            <CardDescription className="text-xs">Direct workflow navigations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {quickShortcuts.filter((s) => s.visible).map((shortcut) => (
              <Button key={shortcut.href} variant="ghost" className="w-full justify-start h-9 rounded-lg hover:bg-muted text-sm font-medium" asChild>
                <Link href={shortcut.href}>
                  <shortcut.icon className="mr-2.5 size-4 text-muted-foreground" />
                  {shortcut.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary Metrics */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Conversion & Performance Summary</CardTitle>
          <CardDescription className="text-xs">Live conversion rates and aggregate engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceKpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} showChevron={false} />
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
