import Redis from 'ioredis';
import { config, useUpstash } from '@/config/index.js';
import { logger } from '@/infrastructure/logging/index.js';

// Types
interface UpstashResponse {
  result: string | null;
  error?: string;
}

// Cliente Redis global (ioredis)
let redis: Redis | null = null;

// Upstash REST client
let upstashConfig: { url: string; token: string } | null = null;

/**
 * Conectar ao Redis (ioredis ou Upstash REST)
 */
export function connectToRedis(): Redis | null {
  // Se usando Upstash REST, não precisa de conexão ioredis
  if (useUpstash) {
    upstashConfig = {
      url: config.UPSTASH_REDIS_REST_URL!,
      token: config.UPSTASH_REDIS_REST_TOKEN!,
    };
    logger.info('Upstash Redis REST client configured', { url: config.UPSTASH_REDIS_REST_URL });
    return null;
  }

  // Conexão tradicional com ioredis
  if (redis) {
    return redis;
  }

  if (!config.REDIS_URL) {
    logger.warn('No Redis URL configured, caching disabled');
    return null;
  }

  redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: false,
    keepAlive: 10000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    tls: config.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    // Retry strategy
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null; // Para de tentar
      }
      const delay = Math.min(times * 200, 2000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
  });

  // Eventos
  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (error) => {
    logger.error('Redis error', { error: error.message });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return redis;
}

/**
 * Obter cliente Redis (ioredis)
 */
export function getRedis(): Redis {
  if (!redis && !useUpstash) {
    throw new Error('Redis not connected. Call connectToRedis() first.');
  }
  return redis!;
}

// =============================================================================
// Upstash REST API Commands
// =============================================================================

async function upstashCommand<T = unknown>(command: string[]): Promise<T | null> {
  if (!upstashConfig) {
    throw new Error('Upstash not configured');
  }

  try {
    const response = await fetch(`${upstashConfig.url}/api/${command[0]}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command.slice(1)),
    });

    if (!response.ok) {
      logger.error('Upstash REST error', { status: response.status });
      return null;
    }

    const data = await response.json() as UpstashResponse;

    if (data.error) {
      logger.error('Upstash command error', { error: data.error });
      return null;
    }

    return data.result as T;
  } catch (error) {
    logger.error('Upstash fetch error', { error: String(error) });
    return null;
  }
}

async function upstashGet(key: string): Promise<string | null> {
  return upstashCommand<string>(['GET', key]);
}

async function upstashSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await upstashCommand(['SETEX', key, String(ttlSeconds), value]);
  } else {
    await upstashCommand(['SET', key, value]);
  }
}

async function upstashDel(...keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const result = await upstashCommand<number>(['DEL', ...keys]);
  return result || 0;
}

async function upstashPing(): Promise<boolean> {
  try {
    const result = await upstashCommand<string>(['PING']);
    return result === 'PONG';
  } catch {
    return false;
  }
}

// =============================================================================
// Unified Redis Operations (works with both ioredis and Upstash)
// =============================================================================

/**
 * Fechar conexão Redis
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
  upstashConfig = null;
}

/**
 * Health check do Redis
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    if (useUpstash) {
      return upstashPing();
    }

    if (!redis) return false;
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

// =============================================================================
// Cache Utilities
// =============================================================================

/**
 * Criar chave com prefixo do tenant
 */
export function createCacheKey(tenantId: string, ...parts: string[]): string {
  return `${config.REDIS_PREFIX}${tenantId}:${parts.join(':')}`;
}

/**
 * Obter valor do cache (JSON parsed)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  let value: string | null = null;

  if (useUpstash) {
    value = await upstashGet(key);
  } else if (redis) {
    value = await redis.get(key);
  } else {
    return null;
  }

  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Definir valor no cache
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);

  if (useUpstash) {
    await upstashSet(key, serialized, ttlSeconds);
  } else if (redis) {
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  }
}

/**
 * Invalidar cache por padrão
 */
export async function cacheInvalidate(pattern: string): Promise<number> {
  if (useUpstash) {
    // Upstash doesn't support SCAN well via REST
    // For production, consider using tagged cache
    logger.warn('Cache invalidation by pattern not fully supported with Upstash REST', { pattern });
    return 0;
  }

  if (!redis) return 0;

  // Usar SCAN para evitar bloqueio em produção
  let cursor = '0';
  let deleted = 0;

  do {
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = result[0];
    const keys = result[1];

    if (keys.length > 0) {
      await redis.del(...keys);
      deleted += keys.length;
    }
  } while (cursor !== '0');

  return deleted;
}

/**
 * Invalidar cache por tags (usando SETs)
 */
export async function cacheInvalidateByTag(tenantId: string, tag: string): Promise<number> {
  const tagKey = createCacheKey(tenantId, 'tags', tag);

  if (useUpstash) {
    // Simplified for Upstash REST
    await upstashDel(tagKey);
    return 1;
  }

  if (!redis) return 0;

  // Obter todas as chaves com esta tag
  const keys = await redis.smembers(tagKey);

  if (keys.length === 0) return 0;

  // Remover as chaves e o tag set
  await redis.del(...keys, tagKey);

  return keys.length;
}

/**
 * Rate limiting - incrementar contador
 */
export async function rateLimitIncr(key: string, windowMs: number): Promise<number> {
  if (useUpstash) {
    // For Upstash, we use a simpler approach
    const current = await cacheGet<number>(key);
    const newValue = (current || 0) + 1;
    await cacheSet(key, newValue, Math.ceil(windowMs / 1000));
    return newValue;
  }

  if (!redis) return 0;

  const multi = redis.multi();
  multi.incr(key);
  multi.pttl(key);

  const results = await multi.exec();

  if (!results || !results[0]) return 0;

  const count = results[0][1] as number;
  const ttl = results[1][1] as number;

  // Set expiry if key is new (ttl = -1 means no expiry, -2 means doesn't exist)
  if (ttl === -1 || ttl === -2) {
    await redis.pexpire(key, windowMs);
  }

  return count;
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (useUpstash) {
    const value = await upstashGet(key);
    return value !== null;
  }

  if (!redis) return false;
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Delete key(s)
 */
export async function cacheDel(...keys: string[]): Promise<number> {
  if (useUpstash) {
    return upstashDel(...keys);
  }

  if (!redis || keys.length === 0) return 0;
  return redis.del(...keys);
}
