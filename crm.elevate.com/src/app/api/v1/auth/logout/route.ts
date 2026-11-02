import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/api/backend-server';

export async function POST() {
  await backendPost('/auth/logout', {}).catch(() => undefined);
  const response = NextResponse.json({ success: true });
  for (const name of ['token', 'auth_token', 'user', 'better-auth.session_token', 'session_token', 'auth.session-token']) response.cookies.delete(name);
  return response;
}
export const GET = POST;
