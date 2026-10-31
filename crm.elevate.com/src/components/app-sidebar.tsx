'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import {
  IconBriefcase,
  IconCash,
  IconChartBar,
  IconCirclePlusFilled,
  IconDashboard,
  IconDatabase,
  IconDotsVertical,
  IconFileInvoice,
  IconFileText,
  IconListDetails,
  IconLogout,
  IconPhoneCall,
  IconSun,
  IconUserCircle,
  IconUserPlus,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import { ChevronRight } from 'lucide-react';

import { ProfileDialog } from '@/components/profile/profile-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { APP_CONFIG } from '@/config/app';
import type { FeatureKey } from '@/constants/permissions';
import { logoutAction } from '@/lib/actions/auth';
import { getPositionDefinition, hasFeatureAccess } from '@/lib/permissions';
import { cn, getInitials } from '@/lib/utils';
import type { UserProfile, UserWithRole } from '@/types/user';

// Navigation data and types

type SidebarCounts = {
  enquiries?: number;
  jobOrdersPending?: number;
  followUps?: number;
};

type NavigationLink = {
  title: string;
  url: string;
  count?: keyof SidebarCounts;
};

type NavigationEntry = NavigationLink & {
  icon: Icon;
  permission: FeatureKey;
  children?: NavigationLink[];
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserWithRole | null;
  counts?: SidebarCounts;
}

const MAIN_ITEMS: NavigationEntry[] = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard, permission: 'dashboard' },
  { title: 'Enquiries', url: '/enquiries', icon: IconUsers, permission: 'enquiries', count: 'enquiries' },
  {
    title: 'Job Orders', url: '/enquiries/job-orders', icon: IconBriefcase, permission: 'job_orders',
    children: [
      { title: 'Pending', url: '/enquiries/job-orders/pending', count: 'jobOrdersPending' },
      { title: 'Completed', url: '/enquiries/job-orders/completed' },
    ],
  },
  { title: 'Follow-ups', url: '/follow-ups', icon: IconListDetails, permission: 'follow_ups', count: 'followUps' },
  { title: 'Call Register', url: '/call-register', icon: IconPhoneCall, permission: 'call_register' },
  { title: 'Site Surveys & Projects', url: '/admissions', icon: IconSun, permission: 'projects' },
  { title: 'Proposals', url: '/proposals', icon: IconFileText, permission: 'proposals' },
];

const ADMIN_ITEMS: NavigationEntry[] = [
  { title: 'Reports', url: '/reports', icon: IconChartBar, permission: 'reports' },
  { title: 'Data Management', url: '/admin/data-management', icon: IconDatabase, permission: 'data_management' },
  { title: 'Users', url: '/admin/users', icon: IconUserPlus, permission: 'users_management' },
];

const FINANCE_ITEMS: NavigationEntry[] = [
  { title: 'Invoices', url: '/invoices', icon: IconFileInvoice, permission: 'invoices' },
  { title: 'Expenses', url: '/expenses', icon: IconCash, permission: 'expenses' },
];

// Shared navigation UI

function isRouteActive(pathname: string, url: string) {
  if (pathname === url) return true;
  if (url === '/dashboard') return false;
  return pathname.startsWith(`${url}/`);
}

function CountBadge({ count }: { count?: number }) {
  if (!count) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-400 group-data-[collapsible=icon]:hidden">
      {count}
    </span>
  );
}

function NavigationItem({ item, pathname, counts }: {
  item: NavigationEntry;
  pathname: string;
  counts?: SidebarCounts;
}) {
  const isActive = isRouteActive(pathname, item.url);
  const ItemIcon = item.icon;
  const badgeCount = item.count ? counts?.[item.count] : undefined;
  const buttonClassName = cn(
    'font-medium transition-colors duration-150',
    'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
    'data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground',
  );
  const iconClassName = cn('size-4.5 shrink-0 opacity-55', isActive && 'opacity-100');

  if (item.children) {
    return (
      <SidebarMenuItem>
        {/* Reopen the matching submenu when navigation changes the current page. */}
        <Collapsible key={pathname} defaultOpen={isActive} className="group/collapsible">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive} className={buttonClassName}>
              <ItemIcon className={iconClassName} />
              <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
              <CountBadge count={badgeCount} />
              <ChevronRight className="ml-auto size-4 shrink-0 opacity-60 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="my-1 ml-5 gap-1 border-sidebar-border/70 pl-2">
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.url}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isRouteActive(pathname, child.url)}
                    className="text-xs font-medium text-sidebar-foreground/80 data-[active=true]:font-semibold data-[active=true]:text-primary"
                  >
                    <Link href={child.url} aria-current={isRouteActive(pathname, child.url) ? 'page' : undefined}>
                      <span>{child.title}</span>
                      <CountBadge count={child.count ? counts?.[child.count] : undefined} />
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive} className={buttonClassName}>
        <Link href={item.url} aria-current={isActive ? 'page' : undefined}>
          <ItemIcon className={iconClassName} />
          <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
          <CountBadge count={badgeCount} />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavigationGroup({ title, items, user, counts, pathname, showQuickCreate = false }: {
  title?: string;
  items: NavigationEntry[];
  user?: UserWithRole | null;
  counts?: SidebarCounts;
  pathname: string;
  showQuickCreate?: boolean;
}) {
  const visibleItems = items.filter((item) => hasFeatureAccess(user, item.permission));
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup className="gap-1 px-5 group-data-[collapsible=icon]:px-2">
      {title && (
        <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {showQuickCreate && (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Quick Create" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
                <IconCirclePlusFilled />
                <span className="group-data-[collapsible=icon]:hidden">Quick Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {visibleItems.map((item) => (
            <NavigationItem key={item.url} item={item} pathname={pathname} counts={counts} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// User account menu

function UserMenu({ user }: { user: UserProfile }) {
  const { isMobile } = useSidebar();
  const { execute: executeLogout, isExecuting: isLoggingOut } = useAction(logoutAction);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const initials = getInitials(user.name);
  const position = getPositionDefinition(user.role);

  return (
    <>
      <ProfileDialog
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                aria-label={`Account menu for ${user.name}`}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-xs">{user.name}</span>
                  <span className="text-[11px] text-primary font-medium truncate">
                    {position.shortTitle}
                  </span>
                  <span className="text-muted-foreground truncate text-[10px]">{user.email}</span>
                </div>
                <IconDotsVertical className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div
                  className="flex items-center gap-2 px-2 py-2 text-left text-sm cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-semibold text-xs">{user.name}</span>
                    <span className="text-[11px] font-medium text-primary truncate">
                      {position.title}
                    </span>
                    <span className="text-muted-foreground truncate text-[10px]">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setShowProfileModal(true)}
                  className="cursor-pointer"
                >
                  <IconUserCircle />
                  Account & Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => executeLogout()}
                disabled={isLoggingOut}
                className="cursor-pointer"
              >
                <IconLogout />
                {isLoggingOut ? 'Signing out...' : 'Log out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

// Main sidebar layout

export function AppSidebar({ user, counts, className, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const position = getPositionDefinition(user?.role);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const updateShadows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 4);
    setShowBottomShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateShadows();
    el.addEventListener('scroll', updateShadows, { passive: true });
    const ro = new ResizeObserver(updateShadows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateShadows);
      ro.disconnect();
    };
  }, [updateShadows]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn('border-r border-border bg-sidebar', className)}
      {...props}
    >
      <SidebarHeader className="px-7 pb-5 pt-8 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm">
            <Image src="/branding/zee-one-logo.png" alt="Zee One logo" width={32} height={32} />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-[18px] font-bold tracking-tight text-foreground">{APP_CONFIG.name}</span>
            <span className="text-[14px] mt-[2px] text-muted-foreground">{position.shortTitle} Workspace</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Scroll-shadow wrapper */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top inset shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 transition-opacity duration-200"
          style={{
            opacity: showTopShadow ? 1 : 0,
            boxShadow: 'rgb(204, 219, 232) 3px 3px 6px 0px inset, rgba(255, 255, 255, 0.5) -3px -3px 6px 1px inset',
          }}
        />

        <SidebarContent ref={scrollRef} className="gap-5 pb-4">
          <NavigationGroup
            items={MAIN_ITEMS}
            user={user}
            counts={counts}
            pathname={pathname}
            showQuickCreate={APP_CONFIG.navigation.showQuickCreate}
          />
          <NavigationGroup title="Administration" items={ADMIN_ITEMS} user={user} pathname={pathname} />
          <NavigationGroup title="Billing & Finance" items={FINANCE_ITEMS} user={user} pathname={pathname} />
        </SidebarContent>

        {/* Bottom inset shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 transition-opacity duration-200"
          style={{
            opacity: showBottomShadow ? 1 : 0,
            boxShadow: 'rgb(204, 219, 232) -3px -3px 6px 0px inset, rgba(255, 255, 255, 0.5) 3px 3px 6px 1px inset',
          }}
        />
      </div>

      <SidebarFooter className="px-5 py-3 group-data-[collapsible=icon]:px-2">
        {user && <UserMenu user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}

