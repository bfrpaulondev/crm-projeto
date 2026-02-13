// =============================================================================
// Auth Middleware
// =============================================================================

import { config } from '@/config/index.js';
import { logger } from '@/infrastructure/logging/index.js';
import { ContextUser, ContextTenant, UserRole, TenantPlan } from '@/types/context.js';
import * as jwt from 'jsonwebtoken';

export interface BuildContextResult {
  user?: ContextUser;
  tenant?: ContextTenant;
  isAuthenticated: boolean;
  requestId: string;
  correlationId: string;
}

export async function buildContext(input: { headers: Record<string, string | undefined> }): Promise<BuildContextResult> {
  const requestId = input.headers['x-request-id'] || crypto.randomUUID();
  const correlationId = input.headers['x-correlation-id'] || crypto.randomUUID();

  const authHeader = input.headers['authorization'] || input.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  logger.info('Building auth context', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenLength: token?.length,
  });

  if (!token) {
    return {
      isAuthenticated: false,
      requestId,
      correlationId,
    };
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
    };

    logger.info('Token verified successfully', {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    });

    const user: ContextUser = {
      id: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role as UserRole,
      firstName: '',
      lastName: '',
    };

    const tenant: ContextTenant = {
      id: decoded.tenantId,
      name: 'Default Tenant',
      slug: 'default',
      plan: TenantPlan.STARTER,
      settings: {
        defaultCurrency: 'USD',
        fiscalYearStart: 1,
        dateFormat: 'MM/DD/YYYY',
        timezone: 'UTC',
        features: {
          customStages: true,
          advancedReporting: false,
          apiAccess: true,
          ssoEnabled: false,
          maxUsers: 10,
          maxRecords: 10000,
        },
      },
    };

    return {
      user,
      tenant,
      isAuthenticated: true,
      requestId,
      correlationId,
    };
  } catch (error) {
    logger.error('Token verification failed', { error: String(error), token: token?.substring(0, 20) + '...' });
    return {
      isAuthenticated: false,
      requestId,
      correlationId,
    };
  }
}
