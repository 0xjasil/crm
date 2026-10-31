import type { Metadata } from 'next';
import './../globals.css';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { APP_CONFIG, theme } from '@/config/app';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { backendRequest } from '@/lib/api/backend-server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { description: APP_CONFIG.description };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession();
  if (!session) redirect('/login');
  const user = session.user;
  const counts = await backendRequest<{ enquiries: number; jobOrdersPending: number; followUps: number }>('/ui/sidebar-counts');

  return (
    <SidebarProvider style={{ '--sidebar-width': theme.sidebarWidth, '--header-height': theme.headerHeight } as React.CSSProperties}>
      <AppSidebar user={user} counts={counts} />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 bg-background min-h-[calc(100vh-var(--header-height))]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
