// =============================================================================
// Bulk Operations Service
// =============================================================================

import { leadRepository } from '@/repositories/lead.repository.js';
import { opportunityRepository } from '@/repositories/opportunity.repository.js';
import { auditLogRepository } from '@/repositories/audit-log.repository.js';
import { Lead, Opportunity } from '@/types/entities.js';
import { logger } from '@/infrastructure/logging/index.js';
import { traceServiceOperation } from '@/infrastructure/otel/tracing.js';

interface BulkUpdateItem {
  id: string;
  changes: Record<string, unknown>;
}

interface BulkResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export class BulkOperationsService {
  // ===========================================================================
  // Lead Bulk Operations
  // ===========================================================================

  async bulkUpdateLeads(
    tenantId: string,
    userId: string,
    updates: BulkUpdateItem[],
    _requestId: string
  ): Promise<BulkResult> {
    return traceServiceOperation('BulkOperationsService', 'bulkUpdateLeads', async () => {
      const result: BulkResult = { success: 0, failed: 0, errors: [] };

      for (const update of updates) {
        try {
          const lead = await leadRepository.findById(update.id, tenantId);
          if (!lead) {
            result.failed++;
            result.errors.push({ id: update.id, error: 'Lead not found' });
            continue;
          }

          const updatedLead = await leadRepository.updateById(
            update.id,
            tenantId,
            update.changes,
            userId
          );

          if (updatedLead) {
            result.success++;
            await auditLogRepository.log({
              tenantId,
              entityType: 'Lead',
              entityId: update.id,
              action: 'UPDATE',
              actorId: userId,
              actorEmail: '',
              changes: { old: lead, new: updatedLead },
              metadata: { bulk: true },
              requestId: '',
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: update.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Bulk update leads completed', {
        tenantId,
        userId,
        success: result.success,
        failed: result.failed,
      });

      return result;
    });
  }

  async bulkDeleteLeads(
    tenantId: string,
    userId: string,
    ids: string[],
    _requestId: string
  ): Promise<BulkResult> {
    return traceServiceOperation('BulkOperationsService', 'bulkDeleteLeads', async () => {
      const result: BulkResult = { success: 0, failed: 0, errors: [] };

      for (const id of ids) {
        try {
          const lead = await leadRepository.findById(id, tenantId);
          if (!lead) {
            result.failed++;
            result.errors.push({ id, error: 'Lead not found' });
            continue;
          }

          const deleted = await leadRepository.deleteById(id, tenantId, userId);

          if (deleted) {
            result.success++;
            await auditLogRepository.log({
              tenantId,
              entityType: 'Lead',
              entityId: id,
              action: 'DELETE',
              actorId: userId,
              actorEmail: '',
              changes: { old: lead },
              metadata: { bulk: true },
              requestId: '',
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Bulk delete leads completed', {
        tenantId,
        userId,
        success: result.success,
        failed: result.failed,
      });

      return result;
    });
  }

  // ===========================================================================
  // Opportunity Bulk Operations
  // ===========================================================================

  async bulkUpdateOpportunities(
    tenantId: string,
    userId: string,
    updates: BulkUpdateItem[],
    _requestId: string
  ): Promise<BulkResult> {
    return traceServiceOperation('BulkOperationsService', 'bulkUpdateOpportunities', async () => {
      const result: BulkResult = { success: 0, failed: 0, errors: [] };

      for (const update of updates) {
        try {
          const opportunity = await opportunityRepository.findById(update.id, tenantId);
          if (!opportunity) {
            result.failed++;
            result.errors.push({ id: update.id, error: 'Opportunity not found' });
            continue;
          }

          const updatedOpp = await opportunityRepository.updateById(
            update.id,
            tenantId,
            update.changes,
            userId
          );

          if (updatedOpp) {
            result.success++;
            await auditLogRepository.log({
              tenantId,
              entityType: 'Opportunity',
              entityId: update.id,
              action: 'UPDATE',
              actorId: userId,
              actorEmail: '',
              changes: { old: opportunity, new: updatedOpp },
              metadata: { bulk: true },
              requestId: '',
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: update.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Bulk update opportunities completed', {
        tenantId,
        userId,
        success: result.success,
        failed: result.failed,
      });

      return result;
    });
  }

  async bulkDeleteOpportunities(
    tenantId: string,
    userId: string,
    ids: string[],
    _requestId: string
  ): Promise<BulkResult> {
    return traceServiceOperation('BulkOperationsService', 'bulkDeleteOpportunities', async () => {
      const result: BulkResult = { success: 0, failed: 0, errors: [] };

      for (const id of ids) {
        try {
          const opportunity = await opportunityRepository.findById(id, tenantId);
          if (!opportunity) {
            result.failed++;
            result.errors.push({ id, error: 'Opportunity not found' });
            continue;
          }

          const deleted = await opportunityRepository.deleteById(id, tenantId, userId);

          if (deleted) {
            result.success++;
            await auditLogRepository.log({
              tenantId,
              entityType: 'Opportunity',
              entityId: id,
              action: 'DELETE',
              actorId: userId,
              actorEmail: '',
              changes: { old: opportunity },
              metadata: { bulk: true },
              requestId: '',
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Bulk delete opportunities completed', {
        tenantId,
        userId,
        success: result.success,
        failed: result.failed,
      });

      return result;
    });
  }
}

export const bulkOperationsService = new BulkOperationsService();
