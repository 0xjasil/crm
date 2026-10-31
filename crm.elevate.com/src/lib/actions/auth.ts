'use server';

import type { CreateUserActionResponse, GetAllUsersResponse, GetAllBranchesResponse } from '@/types/api-responses/auth';

import { backendPost } from '@/lib/api/backend-server';

import { actionClient } from '@/lib/safe-action';

import { auth } from '@/lib/auth';

import { returnValidationErrors } from 'next-safe-action';

import { redirect } from 'next/navigation';

import { cookies } from 'next/headers';

import { loginSchema, userFormSchema } from '@/schema/user-schema';

import { z } from 'zod';

export const createUserAction = actionClient
  .inputSchema(userFormSchema)
  .action(async ({ parsedInput }) => {
    return backendPost<CreateUserActionResponse>('/workflows/auth/createUserAction', { input: parsedInput ?? {} });
  });

export const updateUserBranchAction = actionClient
  .inputSchema(
    z.object({
      userId: z.string(),
      branchId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/auth/updateUserBranchAction', { input: parsedInput ?? {} });
  });

export const updateUserRoleAction = actionClient
  .inputSchema(
    z.object({
      userId: z.string(),
      role: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/auth/updateUserRoleAction', { input: parsedInput ?? {} });
  });

export const updateUserPermissionsAction = actionClient
  .inputSchema(
    z.object({
      userId: z.string(),
      role: z.string().optional(),
      permissions: z.array(z.string()),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: any; }>('/workflows/auth/updateUserPermissionsAction', { input: parsedInput ?? {} });
  });

export const deleteUserAction = actionClient
  .inputSchema(
    z.object({
      userId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/auth/deleteUserAction', { input: parsedInput ?? {} });
  });

export const updateProfileAction = actionClient
  .inputSchema(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string; }>('/workflows/auth/updateProfileAction', { input: parsedInput ?? {} });
  });

export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const signInResult = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      if (!signInResult.user || !signInResult.token) {
        return returnValidationErrors(loginSchema, {
          _errors: [signInResult.error?.message || 'Invalid email or password'],
        });
      }

      const cookieStore = await cookies();
      const isProd = process.env.NODE_ENV === 'production';
      const maxAge = 7 * 24 * 60 * 60; // 7 days

      cookieStore.set('token', signInResult.token, {
        path: '/',
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge,
      });

      cookieStore.set('auth_token', signInResult.token, {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge,
      });

      cookieStore.set('user', encodeURIComponent(JSON.stringify(signInResult.user)), {
        path: '/',
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge,
      });

      return {
        success: true,
        message: 'Login successful',
        data: signInResult.user,
        token: signInResult.token,
        redirectTo: '/dashboard',
      };
    } catch (error) {
      console.error('Login error:', error);
      return returnValidationErrors(loginSchema, {
        _errors: ['Invalid email or password'],
      });
    }
  });

export const logoutAction = actionClient.action(async () => {
  // Clear all auth-related cookies
  const cookieStore = await cookies();

  cookieStore.delete('token');
  cookieStore.delete('auth_token');
  cookieStore.delete('user');
  cookieStore.delete('better-auth.session_token');
  cookieStore.delete('session_token');
  cookieStore.delete('auth.session-token');

  // Redirect to login page
  redirect('/login');
});

export async function getAllUsers(): Promise<GetAllUsersResponse> {
  return backendPost<GetAllUsersResponse>('/workflows/auth/getAllUsers', {  });
}

export async function getAllRoles(): Promise<{ name: string; id: string; createdAt: Date; updatedAt: Date; description: string | null; permissions: string[]; }[]> {
  return backendPost<{ name: string; id: string; createdAt: Date; updatedAt: Date; description: string | null; permissions: string[]; }[]>('/workflows/auth/getAllRoles', {  });
}

export async function getAllBranches(): Promise<GetAllBranchesResponse> {
  return backendPost<GetAllBranchesResponse>('/workflows/auth/getAllBranches', {  });
}

export const changePasswordAction = actionClient
  .inputSchema(
    z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    })
  )
  .action(async ({ parsedInput }) => {
    return backendPost<{ success: boolean; message: string }>('/users/change-password', parsedInput);
  });
