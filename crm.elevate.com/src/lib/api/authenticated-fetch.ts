'use client';

import { getLogoutReason, sessionLogoutUrl } from '@/lib/session-logout';

let signingOut = false;

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  const reason = getLogoutReason(response.status);
  if (reason && typeof window !== 'undefined' && !signingOut) {
    signingOut = true;
    window.location.replace(sessionLogoutUrl(reason));
  }
  return response;
}
