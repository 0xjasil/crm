import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const internal = process.env.BACKEND_INTERNAL_URL;
  const isInternalLocal = !internal || internal.includes('localhost') || internal.includes('127.0.0.1');

  if (isProd && isInternalLocal) {
    return (process.env.PRODUCTION_BACKEND_URL || 'https://crm-backend-ten-pi.vercel.app').replace(/\/$/, '');
  }

  return (
    internal ||
    process.env.PRODUCTION_BACKEND_URL ||
    (isProd ? 'https://crm-backend-ten-pi.vercel.app' : 'http://localhost:5000')
  ).replace(/\/$/, '');
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const backendOrigin = getBackendUrl();
    const destinationPath = `/api/v1/${path.join('/')}`;
    const targetUrl = new URL(destinationPath, backendOrigin);

    // Forward search parameters
    req.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('connection');

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      cache: 'no-store',
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const body = await req.arrayBuffer();
      if (body.byteLength > 0) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const responseData = await response.arrayBuffer();

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(responseData, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API Proxy Handler Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to proxy request',
        },
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;

