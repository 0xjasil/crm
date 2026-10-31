import { backendRequest, backendPost, BackendRequestError } from '@/lib/api/backend-server';
import type { User, Role } from '@/types/api-models';

export type SessionUser = Omit<User, 'password'> & { userRole?: Role | null };
export interface AuthSession {
  user: SessionUser;
  session: { id: string; userId: string; expiresAt: Date };
}

export const auth = {
  api: {
    async getSession(_options?: { headers?: Headers }): Promise<AuthSession | null> {
      try {
        const result = await backendRequest<{ data: SessionUser }>('/auth/me');
        return { user: result.data, session: { id: result.data.id, userId: result.data.id, expiresAt: new Date(Date.now() + 604800000) } };
      } catch { return null; }
    },
    async signInEmail({ body }: { body: { email: string; password: string } }) {
      try {
        const result = await backendPost<{ data: { user: SessionUser; token: string } }>('/auth/login', body);
        return { ...result.data, error: null };
      } catch (error) {
        return {
          user: null,
          token: null,
          error: {
            message: error instanceof Error ? error.message : 'Login failed',
            statusCode: error instanceof BackendRequestError ? error.statusCode : 502,
          },
        };
      }
    },
    async createUser({ body }: { body: { name: string; email: string; password: string; role?: string; branch?: string; data?: { branch?: string } } }) {
      const result = await backendPost<{ user: SessionUser }>('/workflows/auth/createUserAction', {
        input: { ...body, role: body.role || 'telecaller', branch: body.data?.branch || body.branch || '', confirmPassword: body.password },
      });
      return { user: result.user };
    },
  },
};
export default auth;
