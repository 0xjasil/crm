import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect, unstable_rethrow } from 'next/navigation';
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
  IconBriefcase,
  IconFileInvoice,
  IconFileDollar,
  IconChartBar,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getFirstPermittedPath, getPositionDefinition, hasFeatureAccess } from '@/lib/permissions';
import { sessionLogoutUrl } from '@/lib/session-logout';
import { cn } from '@/lib/utils';

export default async function Dashboard() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    unstable_rethrow(err);
    console.error('Dashboard session error:', err);
  }

  if (!session) redirect('/login');

  if (!hasFeatureAccess(session.user, 'dashboard')) {
    const permittedPath = getFirstPermittedPath(session.user);
    redirect(permittedPath === '/dashboard' ? sessionLogoutUrl('access-denied') : permittedPath);
  }

  let branchName: string | undefined;
  if (session.user.role === 'executive' && session.user.branch) {
    try {
      const branch = await backendRequest<{ name: string } | null>('/ui/my-branch');
      branchName = branch?.name;
    } catch (e) {
      unstable_rethrow(e);
      console.warn('Dashboard branch fetch warning:', e);
    }
  }

  const isTelecaller = session.user.role === 'telecaller';
  const isExecutive  = session.user.role === 'executive';
  const dashboardData = await getDashboardData(
    isTelecaller ? session.user.id : undefined,
    session.user.role || undefined,
    isExecutive ? session.user.branch || undefined : undefined,
  );

  const { stats, followUpStats, recentActivity, performanceMetrics } = dashboardData;

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  const userPosition = getPositionDefinition(session.user.role);

  const canAccessEnquiries  = hasFeatureAccess(session.user, 'enquiries');
  const canAccessJobOrders  = hasFeatureAccess(session.user, 'job_orders');
  const canAccessFollowUps  = hasFeatureAccess(session.user, 'follow_ups');
  const canAccessInvoices   = hasFeatureAccess(session.user, 'invoices');
  const canAccessServices   = hasFeatureAccess(session.user, 'services');
  const canAccessProjects   = hasFeatureAccess(session.user, 'projects');
  const canAccessExpenses   = hasFeatureAccess(session.user, 'expenses');
  const canAccessReports    = hasFeatureAccess(session.user, 'reports');

  // ── All 8 KPIs in one unified array ────────────────────────────────────────
  const allKpis = [
    { title: 'Total Enquiries',   value: stats.totalEnquiries,          indicatorColor: 'amber'   as const, href: '/enquiries',                     visible: canAccessEnquiries },
    { title: 'New Enquiries',     value: stats.newEnquiries,            indicatorColor: 'emerald' as const, href: '/enquiries',                     visible: canAccessEnquiries, trend: stats.newEnquiries > 0 ? { value: stats.newEnquiries, isPositive: true, label: 'new' } : undefined },
    { title: 'Pending Follow-ups',value: stats.pendingFollowUps,        indicatorColor: 'slate'   as const, href: '/follow-ups',                    visible: canAccessFollowUps },
    { title: 'Total Calls',       value: stats.totalCalls,              indicatorColor: 'purple'  as const, href: '/call-register',                 visible: true },
    { title: 'Overdue Follow-ups',value: followUpStats.overdueCount,    indicatorColor: 'rose'    as const, href: '/follow-ups?filter=overdue',     visible: canAccessFollowUps },
    { title: "Today's Follow-ups",value: followUpStats.todayCount,      indicatorColor: 'amber'   as const, href: '/follow-ups?filter=today',       visible: canAccessFollowUps },
    { title: 'Confirmed Leads',   value: followUpStats.interestedLeadsCount, indicatorColor: 'emerald' as const, href: '/enquiries?status=CONFIRMED', visible: canAccessEnquiries },
    { title: 'Pipeline',          value: performanceMetrics.totalEnquiries, indicatorColor: 'blue' as const, href: '/enquiries',                    visible: canAccessEnquiries },
  ].filter((k) => k.visible);

  const activityItems = [
    { icon: IconUserPlus,  title: 'New Enquiries', description: (n: number) => `${n} new leads this week`,       count: recentActivity.newEnquiries.count, color: 'blue'    },
    { icon: IconPhoneCall, title: 'Calls Made',    description: (n: number) => `${n} calls completed by team`,   count: recentActivity.callsMade.count,    color: 'emerald' },
    { icon: IconUserCheck, title: 'Enrollments',   description: (n: number) => `${n} successful conversions`,    count: recentActivity.enrollments.count,  color: 'amber'   },
  ];

  const quickShortcuts = [
    { icon: IconEye,          label: 'All Enquiries',        href: '/enquiries',                       visible: canAccessEnquiries  },
    { icon: IconBriefcase,    label: 'Pending Job Orders',   href: '/enquiries/job-orders/pending',    visible: canAccessJobOrders  },
    { icon: IconCalendarClock,label: "Today's Follow-ups",   href: '/follow-ups?filter=today',         visible: canAccessFollowUps  },
    { icon: IconFileInvoice,  label: 'Invoices & Payments',  href: '/invoices',                        visible: canAccessInvoices   },
    { icon: IconFileDollar,   label: 'Service Billing',      href: '/services',                        visible: canAccessServices   },
    { icon: IconUserCheck,    label: 'Site Surveys',         href: '/admissions',                      visible: canAccessProjects   },
    { icon: IconChartBar,     label: 'Reports',              href: '/reports',                         visible: canAccessReports    },
    { icon: IconReceipt,      label: 'Expenses',             href: '/expenses',                        visible: canAccessExpenses   },
  ].filter((s) => s.visible);

  const performanceKpis = [
    { title: 'Interest Rate',    value: `${performanceMetrics.interestRate}%`,   indicatorColor: 'emerald' as const, description: 'High-intent prospects' },
    { title: 'Conversion Rate',  value: `${performanceMetrics.conversionRate}%`, indicatorColor: 'amber'   as const, description: 'Completed admissions'  },
    { title: 'Calls Logged',     value: performanceMetrics.totalCalls,           indicatorColor: 'purple'  as const, description: 'Total call sessions'   },
    { title: 'Active Pipeline',  value: performanceMetrics.totalEnquiries,       indicatorColor: 'blue'    as const, description: 'Enquiries in pipeline' },
  ];

  const activityColorMap: Record<string, string> = {
    blue:    'bg-blue-50    text-blue-600    dark:bg-blue-950/60    dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber:   'bg-amber-50   text-amber-600   dark:bg-amber-950/60   dark:text-amber-400',
  };

  const primaryHeaderAction = [
    { icon: IconUsers,        label: 'View Enquiries', href: '/enquiries',                    visible: canAccessEnquiries },
    { icon: IconBriefcase,    label: 'Job Orders',     href: '/enquiries/job-orders/pending', visible: canAccessJobOrders },
    { icon: IconFileInvoice,  label: 'Invoices',       href: '/invoices',                     visible: canAccessInvoices  },
    { icon: IconFileDollar,   label: 'Service Billing',href: '/services',                     visible: canAccessServices  },
  ].find((a) => a.visible);

  return (
    <PageContainer>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name?.split(' ')[0] || 'User'} · ${formattedDate}`}
        badge={
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex w-full sm:w-auto items-center gap-2">
            {canAccessFollowUps && (
              <Button size="sm" variant="outline" className="h-9 w-9 p-0 sm:w-auto sm:px-3 shrink-0" asChild>
                <Link href="/follow-ups">
                  <IconCalendarClock className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Follow-ups</span>
                </Link>
              </Button>
            )}
            {primaryHeaderAction && (
              <Button size="sm" className="h-9 w-9 p-0 sm:w-auto sm:px-3 shrink-0" asChild>
                <Link href={primaryHeaderAction.href}>
                  <primaryHeaderAction.icon className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">{primaryHeaderAction.label}</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* ── KPI grid — all 8 in one compact grid ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {allKpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} description={undefined} />
        ))}
      </div>

      {/* ── Activity + Quick Shortcuts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border border-border/80 shadow-xs">
          <CardHeader className="pb-3 pt-4 px-4 sm:pb-4 sm:pt-5 sm:px-5">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="size-4 text-primary shrink-0" />
              <CardTitle className="text-sm font-semibold">Activity (Last 7 Days)</CardTitle>
            </div>
            <CardDescription className="text-xs">Weekly engagement summary</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2">
            {activityItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', activityColorMap[item.color])}>
                    <item.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm leading-tight">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.description(item.count)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-bold shrink-0 ml-2 tabular-nums">
                  {item.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Shortcuts */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3 pt-4 px-4 sm:pb-4 sm:pt-5 sm:px-5">
            <CardTitle className="text-sm font-semibold">Quick Shortcuts</CardTitle>
            <CardDescription className="text-xs">Direct navigation</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            {/* 2-col grid on mobile, single col on desktop */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-1 lg:grid-cols-1">
              {quickShortcuts.map((shortcut) => (
                <Button
                  key={shortcut.href}
                  variant="ghost"
                  className="w-full justify-start h-9 rounded-lg hover:bg-muted text-xs font-medium px-2.5"
                  asChild
                >
                  <Link href={shortcut.href}>
                    <shortcut.icon className="mr-2 size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{shortcut.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Performance Summary ─────────────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:pb-4 sm:pt-5 sm:px-5">
          <CardTitle className="text-sm font-semibold">Performance Summary</CardTitle>
          <CardDescription className="text-xs">Live conversion rates and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            {performanceKpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} showChevron={false} />
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
