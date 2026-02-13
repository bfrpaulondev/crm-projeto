// =============================================================================
// Reporting Resolvers
// =============================================================================

import { builder } from '../schema/builder.js';
import { reportingService } from '@/services/reporting.service.js';

// Dashboard Stats Type
builder.simpleObject('DashboardStats', {
  fields: (t) => ({
    totalLeads: t.int(),
    qualifiedLeads: t.int(),
    convertedLeads: t.int(),
    totalOpportunities: t.int(),
    openOpportunities: t.int(),
    totalPipelineValue: t.float(),
    wonValue: t.float(),
    lostValue: t.float(),
  }),
});

// Pipeline By Stage
builder.simpleObject('PipelineStageStats', {
  fields: (t) => ({
    stageId: t.string(),
    stageName: t.string(),
    count: t.int(),
    value: t.float(),
    probability: t.int(),
  }),
});

// Lead Source Stats
builder.simpleObject('LeadSourceStats', {
  fields: (t) => ({
    source: t.string(),
    total: t.int(),
    converted: t.int(),
    conversionRate: t.float(),
  }),
});

// Activity Stats
builder.simpleObject('ActivityStats', {
  fields: (t) => ({
    type: t.string(),
    count: t.int(),
    completed: t.int(),
  }),
});

// Dashboard Query
builder.queryField('dashboard', (t) => ({
  type: 'DashboardStats',
  resolve: async (_parent, _args, ctx) => {
    if (!ctx.tenant) {
      throw new Error('Tenant required');
    }
    return reportingService.getDashboardStats(ctx.tenant.id);
  },
}));

// Lead Conversion Stats Query
builder.queryField('leadConversionStats', (t) => ({
  type: 'LeadSourceStats',
  list: true,
  resolve: async (_parent, _args, ctx) => {
    if (!ctx.tenant) {
      throw new Error('Tenant required');
    }
    const stats = await reportingService.getLeadConversionStats(ctx.tenant.id);
    return stats.bySource;
  },
}));

// Activity Stats Query
builder.queryField('activityStats', (t) => ({
  type: 'ActivityStats',
  list: true,
  resolve: async (_parent, _args, ctx) => {
    if (!ctx.tenant) {
      throw new Error('Tenant required');
    }
    const stats = await reportingService.getActivityStats(ctx.tenant.id);
    return stats.byType;
  },
}));
