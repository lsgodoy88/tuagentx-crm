import { redis } from './redis'
import { NextRequest } from 'next/server'

export type RateLimitConfig = {
  limite: number      // max requests
  ventana: number     // segundos
  identificador?: string  // clave personalizada
}

const CONFIGS: Record<string, RateLimitConfig> = {
  auth:     { limite: 5,   ventana: 60  },
  ia:       { limite: 10,  ventana: 60  },
  webhook:  { limite: 100, ventana: 60  },
  audit:    { limite: 10,  ventana: 3600 },
  default:  { limite: 60,  ventana: 60  },
}

function getCategoria(pathname: string): string {
  if (pathname.startsWith('/api/auth'))           return 'auth'
  if (pathname.startsWith('/api/audit'))          return 'audit'
  if (pathname.startsWith('/api/wompi'))          return 'webhook'
  if (pathname.startsWith('/api/cotizador'))      return 'webhook'
  if (pathname.includes('analizar') || pathname.includes('crecer') || pathname.includes('simulador')) return 'ia'
  return 'default'
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export async function rateLimit(
  req: NextRequest,
  categoriaOverride?: string
): Promise<{ ok: boolean; restante: number; limite: number }> {
  try {
    const categoria = categoriaOverride || getCategoria(req.nextUrl.pathname)
    const config = CONFIGS[categoria] || CONFIGS.default
    const ip = getIp(req)
    const key = `rl:${categoria}:${ip}`

    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.ttl(key)
    const [[, count], [, ttl]] = await pipeline.exec() as any

    if (ttl === -1) await redis.expire(key, config.ventana)

    const ok = (count as number) <= config.limite
    const restante = Math.max(0, config.limite - (count as number))

    return { ok, restante, limite: config.limite }
  } catch {
    // Si Redis falla, permitir el request
    return { ok: true, restante: 999, limite: 999 }
  }
}

export function rateLimitHeaders(resultado: { restante: number; limite: number }) {
  return {
    'X-RateLimit-Limit': String(resultado.limite),
    'X-RateLimit-Remaining': String(resultado.restante),
  }
}
