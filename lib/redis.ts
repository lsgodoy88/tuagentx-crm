import Redis from 'ioredis'

const globalForRedis = globalThis as any

export const redis: Redis =
  globalForRedis.redis || new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export async function invalidarCacheComportamientos() {
  try { await redis.del('bot:comportamientos') } catch {}
}
