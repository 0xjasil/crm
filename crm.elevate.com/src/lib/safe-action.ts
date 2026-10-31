import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { auth } from '@/lib/auth';
import { BackendRequestError } from '@/lib/api/backend-server';

function handleServerError(error: Error) {
  console.error('Action error:', error.message);
  return error instanceof BackendRequestError ? error.message : DEFAULT_SERVER_ERROR_MESSAGE;
}

export const actionClient = createSafeActionClient({ handleServerError });

export const authActionClient = createSafeActionClient({ handleServerError }).use(async ({ next }) => {
  const session = await auth.api.getSession();
  if (!session) throw new Error('Unauthorized');
  return next({ ctx: { user: session.user, session: session.session, userId: session.user.id } });
});

export function createRoleActionClient(allowedRoles: string[]) {
  return createSafeActionClient({ handleServerError }).use(async ({ next }) => {
    const session = await auth.api.getSession();
    if (!session) throw new Error('Unauthorized');
    const userRole = session.user.role || 'user';
    if (!allowedRoles.includes(userRole)) throw new Error('Insufficient permissions');
    return next({ ctx: { user: session.user, session: session.session, userId: session.user.id, userRole } });
  });
}

export const adminActionClient = createRoleActionClient(['admin']);
export const executiveActionClient = createRoleActionClient(['admin', 'executive']);
export const allRolesActionClient = createRoleActionClient(['admin', 'executive', 'telecaller']);
