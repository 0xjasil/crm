import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get('reason') === 'access-denied'
    ? 'access-denied' : 'session-expired';
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('reason', reason);
  const response = NextResponse.redirect(loginUrl, 303);
  response.headers.set('Cache-Control', 'no-store');
  for (const name of ['token', 'auth_token', 'user', 'better-auth.session_token', 'session_token', 'auth.session-token']) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
  return response;
}
