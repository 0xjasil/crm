import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendRequest } from '@/lib/api/backend-server';
import CompletedJobOrdersClient from './client';

export default async function CompletedJobOrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const userRole = session.user.role || 'staff';
  const userId = session.user.id;

  const { branches, availableManagers } = await backendRequest<{ branches: { id: string; name: string }[]; availableManagers: { id: string; name: string; email: string }[] }>('/ui/job-order-options');

  return (
    <CompletedJobOrdersClient 
       userRole={userRole} 
       userId={userId} 
       branches={branches}
       availableManagers={availableManagers}
    />
  );
}
