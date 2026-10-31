import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const result = await auth.api.signInEmail({ body: await request.json() });
  if (!result.user || !result.token) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.error?.statusCode || 502 },
    );
  }
  const response = NextResponse.json({ success: true, data: { user: result.user, token: result.token } });
  const options = { path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 604800 };
  response.cookies.set('auth_token', result.token, { ...options, httpOnly: true });
  response.cookies.set('token', result.token, options);
  response.cookies.set('user', encodeURIComponent(JSON.stringify(result.user)), options);
  return response;
}
