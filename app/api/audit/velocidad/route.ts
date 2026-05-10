import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const AUDIT_SECRET = process.env.AUDIT_SECRET

const UMBRALES = {
  db:       { optimo: 50,   aceptable: 150,  unidad: 'ms' },
  api:      { optimo: 100,  aceptable: 300,  unidad: 'ms' },
  api_ia:   { optimo: 2000, aceptable: 5000, unidad: 'ms' },
  webhook:  { optimo: 500,  aceptable: 1500, unidad: 'ms' },
}

const ENDPOINTS = [
  { nombre: 'panel_bots',      url: 'http://localhost:3000/api/bots',           tipo: 'api',    descripcion: 'Lista de bots activos' },
  { nombre: 'panel_cartera',   url: 'http://localhost:3000/api/cartera',         tipo: 'api',    descripcion: 'Cartera de clientes' },
  { nombre: 'panel_ventas',    url: 'http://localhost:3000/api/ventas',          tipo: 'api',    descripcion: 'Ventas del panel' },
  { nombre: 'gestor_rutas',    url: 'http://localhost:3010/api/rutas',           tipo: 'api',    descripcion: 'Rutas de entrega' },
  { nombre: 'gestor_cartera',  url: 'http://localhost:3010/api/cartera',         tipo: 'api',    descripcion: 'Cartera gestor' },
  { nombre: 'master_overview', url: 'http://localhost:3020/api/overview',        tipo: 'api',    descripcion: 'Overview master — consultas multitabla' },
]

function evaluar(ms: number, tipo: keyof typeof UMBRALES) {
  const u = UMBRALES[tipo]
  if (ms <= u.optimo)     return { estado: 'OPTIMO',    color: 'verde',    delta: `-${u.optimo - ms}ms bajo el optimo` }
  if (ms <= u.aceptable)  return { estado: 'ACEPTABLE', color: 'amarillo', delta: `+${ms - u.optimo}ms sobre el optimo` }
  return                         { estado: 'LENTO',     color: 'rojo',     delta: `+${ms - u.optimo}ms sobre el optimo` }
}

const CAUSAS: Record<string, string> = {
  panel_bots:      'Consulta a Evolution DB — puede ser lenta si hay muchas instancias activas',
  panel_cartera:   'Join entre CarteraCliente y SyncDeuda — revisar indices en fModificado',
  panel_ventas:    'Query con filtros de fecha — revisar indice en createdAt',
  gestor_rutas:    'Carga de rutas con clientes anidados — posible N+1 query',
  gestor_cartera:  'Sync con UpTres — dependiente de API externa',
  master_overview: 'Consultas multitabla Prisma + llamadas externas sin cache',
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-audit-secret')
  if (secret !== AUDIT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ahora = Date.now()

  // DB Evolution
  const t1 = Date.now()
  await prisma.instance.count()
  const db_ms = Date.now() - t1
  const db_eval = evaluar(db_ms, 'db')

  // Endpoints
  const resultados = await Promise.all(
    ENDPOINTS.map(async (e) => {
      const t = Date.now()
      try {
        await fetch(e.url, { signal: AbortSignal.timeout(6000) })
        const ms = Date.now() - t
        const ev = evaluar(ms, e.tipo as keyof typeof UMBRALES)
        return {
          endpoint: e.nombre,
          descripcion: e.descripcion,
          ms,
          optimo_ms: UMBRALES[e.tipo as keyof typeof UMBRALES].optimo,
          aceptable_ms: UMBRALES[e.tipo as keyof typeof UMBRALES].aceptable,
          ...ev,
          posible_causa: ev.estado !== 'OPTIMO' ? CAUSAS[e.nombre] : null,
        }
      } catch {
        const ms = Date.now() - t
        return {
          endpoint: e.nombre,
          descripcion: e.descripcion,
          ms,
          optimo_ms: UMBRALES[e.tipo as keyof typeof UMBRALES].optimo,
          aceptable_ms: UMBRALES[e.tipo as keyof typeof UMBRALES].aceptable,
          estado: 'TIMEOUT',
          color: 'rojo',
          delta: 'Sin respuesta',
          posible_causa: 'Servicio caido o red interna bloqueada',
        }
      }
    })
  )

  const optimos    = resultados.filter(r => r.estado === 'OPTIMO').length
  const aceptables = resultados.filter(r => r.estado === 'ACEPTABLE').length
  const lentos     = resultados.filter(r => r.estado === 'LENTO' || r.estado === 'TIMEOUT')
  const score      = Math.round((optimos * 100 + aceptables * 60) / resultados.length)

  const resumen = lentos.length === 0
    ? `Todos los endpoints en optimo o aceptable. Score ${score}/100.`
    : `${lentos.length} endpoint(s) con problema: ${lentos.map(l => l.endpoint).join(', ')}. Score ${score}/100.`

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    total_audit_ms: Date.now() - ahora,
    score: `${score}/100`,
    accion_requerida: lentos.length > 0,
    resumen,
    db_evolution: {
      ms: db_ms,
      optimo_ms: UMBRALES.db.optimo,
      ...db_eval,
    },
    endpoints: resultados,
    lentos: lentos.map(l => ({
      endpoint: l.endpoint,
      ms: l.ms,
      causa: l.posible_causa,
    })),
  })
}
