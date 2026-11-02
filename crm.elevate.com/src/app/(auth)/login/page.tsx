// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';

export default async function Login({ searchParams }: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const { reason } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm logoutReason={typeof reason === 'string' ? reason : undefined} />
    </div>
  );
}