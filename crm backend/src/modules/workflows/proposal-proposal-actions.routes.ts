import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createProposalProposalActionsService } from './proposal-proposal-actions.service.js';
import { requireWorkflowAccess } from './workflow-access.js';
export const ProposalProposalActionsRoutes: FastifyPluginAsync = async (app) => {
    app.post('/getProposals', async (request) => {
        requireWorkflowAccess(request.currentUser, 'proposal-proposal-actions', 'getProposals');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createProposalProposalActionsService(app.prisma, request.currentUser).getProposals(body.input);
    });
    app.post('/getProposalById', async (request) => {
        requireWorkflowAccess(request.currentUser, 'proposal-proposal-actions', 'getProposalById');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createProposalProposalActionsService(app.prisma, request.currentUser).getProposalById(body.input);
    });
    app.post('/createProposal', async (request) => {
        requireWorkflowAccess(request.currentUser, 'proposal-proposal-actions', 'createProposal');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createProposalProposalActionsService(app.prisma, request.currentUser).createProposal(body.input);
    });
    app.post('/updateProposal', async (request) => {
        requireWorkflowAccess(request.currentUser, 'proposal-proposal-actions', 'updateProposal');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createProposalProposalActionsService(app.prisma, request.currentUser).updateProposal(body.input);
    });
    app.post('/deleteProposal', async (request) => {
        requireWorkflowAccess(request.currentUser, 'proposal-proposal-actions', 'deleteProposal');
        const body = z.object({ input: z.unknown().optional() }).parse(request.body || {});
        return createProposalProposalActionsService(app.prisma, request.currentUser).deleteProposal(body.input);
    });
};
