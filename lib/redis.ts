/**
 * Redis Client for Session Caching and Rate Limiting
 * Self-hosted Redis via Coolify on Wedos VPS ON
 */

import { Redis } from 'ioredis'

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryDelayOnFailover: 100,
  lazyConnect: true
})

// Connection event handlers
redis.on('connect', () => {
  console.log('[Redis] Connected to Redis server')
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err)
})

redis.on('ready', () => {
  console.log('[Redis] Ready to accept commands')
})

/**
 * Cache a value with optional TTL (in seconds)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl?: number
): Promise<void> {
  const serialized = JSON.stringify(value)
  if (ttl) {
    await redis.setex(key, ttl, serialized)
  } else {
    await redis.set(key, serialized)
  }
}

/**
 * Get cached value
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  if (!value) return null
  return JSON.parse(value) as T
}

/**
 * Delete cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key)
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * Rate limiter - check and increment
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  // Use sorted set for sliding window
  const multi = redis.multi()
  
  // Remove old entries
  multi.zremrangebyscore(key, 0, windowStart)
  
  // Count current entries
  multi.zcard(key)
  
  // Add new entry
  multi.zadd(key, now, `${now}-${Math.random()}`)
  
  // Set expiry
  multi.expire(key, windowSeconds)
  
  const results = await multi.exec()
  
  const currentCount = (results?.[1]?.[1] as number) || 0
  const remaining = Math.max(0, limit - currentCount - 1)
  const reset = now + windowSeconds

  return {
    success: currentCount < limit,
    remaining,
    reset
  }
}

/**
 * Session cache helpers
 */
export const sessionCache = {
  async set(sessionId: string, data: unknown, ttl = 60 * 60 * 24 * 7): Promise<void> {
    await cacheSet(`session:${sessionId}`, data, ttl)
  },

  async get<T>(sessionId: string): Promise<T | null> {
    return cacheGet<T>(`session:${sessionId}`)
  },

  async delete(sessionId: string): Promise<void> {
    await cacheDelete(`session:${sessionId}`)
  },

  async deleteUserSessions(userId: string): Promise<void> {
    await cacheDeletePattern(`session:*:${userId}`)
  }
}

/**
 * Health check for Redis
 */
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch {
    return false
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  await redis.quit()
}

export { redis }
