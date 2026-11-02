export const SESSION_MESSAGES = {
  'access-denied': 'You have been signed out because your account does not have permission to access this feature. Please contact your administrator.',
  'session-expired': 'Your session has expired or is no longer valid. Please sign in again.',
} as const;

export type LogoutReason = keyof typeof SESSION_MESSAGES;

export function getLogoutReason(status: number): LogoutReason | null {
  if (status === 401) return 'session-expired';
  if (status === 403) return 'access-denied';
  return null;
}

export function sessionLogoutUrl(reason: LogoutReason): string {
  return '/api/v1/auth/session-ended?reason=' + reason;
}
