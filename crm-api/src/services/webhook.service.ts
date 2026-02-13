// =============================================================================
// Webhook Service
// =============================================================================

import { webhookRepository, Webhook, WebhookEvent, WebhookDelivery as WebhookDeliveryType } from '@/repositories/webhook.repository.js';
import { logger } from '@/infrastructure/logging/index.js';
import { traceServiceOperation } from '@/infrastructure/otel/tracing.js';
import { cacheGet, cacheSet } from '@/infrastructure/redis/client.js';

interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive?: boolean;
}

interface TestWebhookResult {
  success: boolean;
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
}

export class WebhookService {
  private readonly maxRetries = 3;
  private readonly timeout = 30000; // 30 seconds

  async create(
    tenantId: string,
    userId: string,
    input: CreateWebhookInput
  ): Promise<Webhook> {
    return traceServiceOperation('WebhookService', 'create', async () => {
      const webhook = await webhookRepository.create({
        tenantId,
        name: input.name,
        url: input.url,
        events: input.events,
        secret: input.secret || crypto.randomUUID(),
        isActive: input.isActive ?? true,
        createdBy: userId,
      });

      logger.info('Webhook created', {
        webhookId: webhook._id.toHexString(),
        tenantId,
        events: input.events,
      });

      return webhook;
    });
  }

  async list(tenantId: string): Promise<Webhook[]> {
    return webhookRepository.findAll(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<Webhook | null> {
    return webhookRepository.findById(id, tenantId);
  }

  async update(
    id: string,
    tenantId: string,
    updates: Partial<CreateWebhookInput>
  ): Promise<Webhook | null> {
    return traceServiceOperation('WebhookService', 'update', async () => {
      const webhook = await webhookRepository.updateById(id, tenantId, updates);

      if (webhook) {
        logger.info('Webhook updated', {
          webhookId: id,
          tenantId,
        });
      }

      return webhook;
    });
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    return traceServiceOperation('WebhookService', 'delete', async () => {
      const deleted = await webhookRepository.deleteById(id, tenantId);

      if (deleted) {
        logger.info('Webhook deleted', {
          webhookId: id,
          tenantId,
        });
      }

      return deleted;
    });
  }

  async test(id: string, tenantId: string): Promise<TestWebhookResult> {
    return traceServiceOperation('WebhookService', 'test', async () => {
      const webhook = await webhookRepository.findById(id, tenantId);

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const startTime = Date.now();

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Test': 'true',
            'X-Webhook-Secret': webhook.secret,
          },
          body: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
            webhookId: id,
          }),
          signal: AbortSignal.timeout(this.timeout),
        });

        const responseTime = Date.now() - startTime;

        return {
          success: response.ok,
          statusCode: response.status,
          responseTime,
          error: response.ok ? null : `HTTP ${response.status}`,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
          success: false,
          statusCode: null,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  async triggerEvent(
    tenantId: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    return traceServiceOperation('WebhookService', 'triggerEvent', async () => {
      const webhooks = await webhookRepository.findActiveByEvent(tenantId, event);

      if (webhooks.length === 0) {
        return;
      }

      const deliveries: Promise<void>[] = webhooks.map(webhook =>
        this.deliverWebhook(webhook, event, payload)
      );

      await Promise.allSettled(deliveries);
    });
  }

  private async deliverWebhook(
    webhook: Webhook,
    event: string,
    payload: unknown
  ): Promise<void> {
    const deliveryId = crypto.randomUUID();
    const startTime = Date.now();

    let success = false;
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Secret': webhook.secret,
          'X-Webhook-Delivery': deliveryId,
        },
        body: JSON.stringify({
          id: deliveryId,
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      success = response.ok;
      statusCode = response.status;

      if (!response.ok) {
        errorMessage = `HTTP ${response.status}`;
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    // Log delivery
    await webhookRepository.logDelivery({
      webhookId: webhook._id.toHexString(),
      tenantId: webhook.tenantId,
      event,
      deliveryId,
      success,
      statusCode: statusCode ?? undefined,
      responseTime,
      error: errorMessage,
      attempt: 1,
      timestamp: new Date(),
    });

    // Update webhook stats
    await webhookRepository.updateStats(webhook._id.toHexString(), webhook.tenantId, {
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: success ? 'SUCCESS' : 'FAILED',
      totalDeliveries: 1,
      failedDeliveries: success ? 0 : 1,
    });

    logger.info('Webhook delivered', {
      webhookId: webhook._id.toHexString(),
      event,
      success,
      statusCode,
      responseTime,
    });
  }

  async getDeliveryHistory(
    webhookId: string,
    tenantId: string,
    limit = 50
  ): Promise<WebhookDeliveryType[]> {
    return webhookRepository.getDeliveryHistory(webhookId, tenantId, limit);
  }
}

export const webhookService = new WebhookService();
