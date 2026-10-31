import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthService } from './auth.service.js';
import { requireWorkflowAccess } from './workflow-access.js';
export const AuthRoutes: FastifyPluginAsync = async (app) => {
    app.post('/createUserAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'createUserAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).createUserAction(body.input);
    });
    app.post('/updateUserBranchAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'updateUserBranchAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).updateUserBranchAction(body.input);
    });
    app.post('/updateUserRoleAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'updateUserRoleAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).updateUserRoleAction(body.input);
    });
    app.post('/updateUserPermissionsAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'updateUserPermissionsAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).updateUserPermissionsAction(body.input);
    });
    app.post('/deleteUserAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'deleteUserAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).deleteUserAction(body.input);
    });
    app.post('/updateProfileAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'updateProfileAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).updateProfileAction(body.input);
    });
    app.post('/getAllUsers', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'getAllUsers');
        z.object({}).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).getAllUsers();
    });
    app.post('/getAllRoles', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'getAllRoles');
        z.object({}).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).getAllRoles();
    });
    app.post('/getAllBranches', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'getAllBranches');
        z.object({}).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).getAllBranches();
    });
    app.post('/changePasswordAction', async (request) => {
        requireWorkflowAccess(request.currentUser, 'auth', 'changePasswordAction');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createAuthService(app.prisma, request.currentUser).changePasswordAction(body.input);
    });
};
