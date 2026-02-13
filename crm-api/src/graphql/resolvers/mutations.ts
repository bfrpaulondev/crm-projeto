// =============================================================================
// GraphQL Mutations
// =============================================================================

import { builder } from '../schema/builder.js';
import { leadService } from '@/services/lead.service.js';
import { userService } from '@/services/user.service.js';
import { webhookService } from '@/services/webhook.service.js';
import { LeadStatus } from '@/types/entities.js';

// =============================================================================
// Auth Mutations
// =============================================================================

builder.mutationField('login', (t) => ({
  type: builder.simpleObject('LoginResult', {
    fields: (t) => ({
      accessToken: t.string(),
      refreshToken: t.string(),
      userId: t.string(),
      email: t.string(),
    }),
  }),
  args: {
    email: t.arg.string({ required: true }),
    password: t.arg.string({ required: true }),
    tenantId: t.arg.string({ required: true }),
  },
  resolve: async (_parent, args) => {
    const result = await userService.login(args.email, args.password, args.tenantId);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.user.id,
      email: result.user.email,
    };
  },
}));

// =============================================================================
// Lead Mutations
// =============================================================================

builder.mutationField('createLead', (t) => ({
  type: builder.simpleObject('CreateLeadResult', {
    fields: (t) => ({
      id: t.string(),
      email: t.string(),
      status: t.string(),
    }),
  }),
  args: {
    firstName: t.arg.string({ required: true }),
    lastName: t.arg.string({ required: true }),
    email: t.arg.string({ required: true }),
    phone: t.arg.string({ required: false }),
    companyName: t.arg.string({ required: false }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    const lead = await leadService.create(
      ctx.tenant.id,
      ctx.user.id,
      {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone ?? null,
        companyName: args.companyName ?? null,
        tags: [],
      },
      ctx.requestId
    );

    return {
      id: lead._id.toHexString(),
      email: lead.email,
      status: lead.status,
    };
  },
}));

builder.mutationField('qualifyLead', (t) => ({
  type: builder.simpleObject('QualifyLeadResult', {
    fields: (t) => ({
      id: t.string(),
      status: t.string(),
    }),
  }),
  args: {
    id: t.arg.string({ required: true }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    const lead = await leadService.qualify(args.id, ctx.tenant.id, ctx.user.id);

    return {
      id: lead._id.toHexString(),
      status: lead.status,
    };
  },
}));

builder.mutationField('convertLead', (t) => ({
  type: builder.simpleObject('ConvertLeadResult', {
    fields: (t) => ({
      leadId: t.string(),
      accountId: t.string(),
      contactId: t.string(),
      opportunityId: t.string({ nullable: true }),
    }),
  }),
  args: {
    leadId: t.arg.string({ required: true }),
    createOpportunity: t.arg.boolean({ required: false }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    const result = await leadService.convert(
      ctx.tenant.id,
      ctx.user.id,
      {
        leadId: args.leadId,
        createOpportunity: args.createOpportunity ?? true,
      },
      ctx.requestId
    );

    return {
      leadId: result.lead._id.toHexString(),
      accountId: result.account._id.toHexString(),
      contactId: result.contact._id.toHexString(),
      opportunityId: result.opportunity?._id.toHexString() ?? null,
    };
  },
}));

builder.mutationField('deleteLead', (t) => ({
  type: 'Boolean',
  args: {
    id: t.arg.string({ required: true }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    return leadService.delete(args.id, ctx.tenant.id, ctx.user.id, ctx.requestId);
  },
}));

// =============================================================================
// Webhook Mutations
// =============================================================================

builder.mutationField('createWebhook', (t) => ({
  type: builder.simpleObject('WebhookResult', {
    fields: (t) => ({
      id: t.string(),
      name: t.string(),
      url: t.string(),
      isActive: t.boolean(),
    }),
  }),
  args: {
    name: t.arg.string({ required: true }),
    url: t.arg.string({ required: true }),
    events: t.arg.stringList({ required: true }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    const webhook = await webhookService.create(ctx.tenant.id, ctx.user.id, {
      name: args.name,
      url: args.url,
      events: args.events as never[],
    });

    return {
      id: webhook._id.toHexString(),
      name: webhook.name,
      url: webhook.url,
      isActive: webhook.isActive,
    };
  },
}));

builder.mutationField('deleteWebhook', (t) => ({
  type: 'Boolean',
  args: {
    id: t.arg.string({ required: true }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant) {
      throw new Error('Tenant required');
    }

    return webhookService.delete(args.id, ctx.tenant.id);
  },
}));
