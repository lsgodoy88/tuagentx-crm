import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const AUDIT_SECRET = process.env.AUDIT_SECRET

const PATRONES_ERROR = [
  { patron: 'TypeError', nivel: 'ERROR', descripcion: 'Error de tipo — variable undefined o null' },
  { patron: 'Cannot read properties', nivel: 'ERROR', descripcion: 'Acceso a propiedad de objeto nulo' },
  { patron: 'ECONNREFUSED', nivel: 'CRITICO', descripcion: 'Conexion rechazada — servicio caido' },
  { patron: 'ETIMEDOUT', nivel: 'CRITICO', descripcion: 'Timeout de conexion — servicio lento o caido' },
  { patron: 'ENOTFOUND', nivel: 'CRITICO', descripcion: 'DNS no resuelto — problema de red' },
  { patron: 'Prisma', nivel: 'ERROR', descripcion: 'Error de base de datos Prisma' },
  { patron: 'P2002', nivel: 'ERROR', descripcion: 'Violacion de constraint unique en DB' },
  { patron: 'P2025', nivel: 'ERROR', descripcion: 'Registro no encontrado en DB' },
  { patron: 'UnhandledPromiseRejection', nivel: 'CRITICO', descripcion: 'Promesa rechazada sin manejar' },
  { patron: 'heap out of memory', nivel: 'CRITICO', descripcion: 'Memoria agotada — memory leak' },
  { patron: 'SIGTERM', nivel: 'ALERTA', descripcion: 'Proceso terminado — posible restart forzado' },
  { patron: 'SyntaxError', nivel: 'ERROR', descripcion: 'Error de sintaxis en JSON o codigo' },
  { patron: '500', nivel: 'ERROR', descripcion: 'Error interno del servidor HTTP 500' },
  { patron: 'socket hang up', nivel: 'ERROR', descripcion: 'Conexion cerrada inesperadamente' },
  { patron: 'EVOLUTION', nivel: 'ALERTA', descripcion: 'Error relacionado con Evolution/WhatsApp' },
]

async function getPm2Logs(proceso: string, lineas = 200): Promise<string> {
  try {
    const { stdout } = await execAsync(`pm2 logs ${proceso} --nostream --lines ${lineas} 2>/dev/null || echo ''`)
    return stdout
  } catch { return '' }
}

async function getDockerLogs(contenedor: string, lineas = 100): Promise<string> {
  try {
    const { stdout } = await execAsync(`docker logs --tail=${lineas} ${contenedor} 2>&1 || echo ''`)
    return stdout
  } catch { return '' }
}

function analizarLogs(logs: string, fuente: string) {
  const lineas = logs.split('\n').filter(Boolean)
  const errores: any[] = []
  const conteo: Record<string, number> = {}

  for (const linea of lineas) {
    for (const { patron, nivel, descripcion } of PATRONES_ERROR) {
      if (linea.toLowerCase().includes(patron.toLowerCase())) {
        const key = `${fuente}::${patron}`
        conteo[key] = (conteo[key] || 0) + 1
        if (conteo[key] === 1) {
          errores.push({
            fuente,
            patron,
            nivel,
            descripcion,
            ocurrencias: 0,
            ejemplo: linea.slice(0, 200),
          })
        }
        const err = errores.find(e => e.fuente === fuente && e.patron === patron)
        if (err) err.ocurrencias = conteo[key]
        break
      }
    }
  }

  const criticos = errores.filter(e => e.nivel === 'CRITICO')
  const normales = errores.filter(e => e.nivel === 'ERROR')
  const alertas = errores.filter(e => e.nivel === 'ALERTA')

  return {
    fuente,
    total_lineas: lineas.length,
    errores_criticos: criticos.length,
    errores_normales: normales.length,
    alertas: alertas.length,
    estado: criticos.length > 0 ? 'CRITICO' : normales.length > 5 ? 'ALERTA' : normales.length > 0 ? 'REVISION' : 'LIMPIO',
    color: criticos.length > 0 ? 'rojo' : normales.length > 5 ? 'naranja' : normales.length > 0 ? 'amarillo' : 'verde',
    detalle: errores.sort((a, b) => b.ocurrencias - a.ocurrencias),
  }
}

async function getNginxLogs() {
  try {
    const { stdout: access } = await execAsync("tail -100 /var/log/nginx/access.log 2>/dev/null || echo ''")
    const { stdout: error } = await execAsync("tail -100 /var/log/nginx/error.log 2>/dev/null || echo ''")

    const lineas_access = access.split('\n').filter(Boolean)
    const errores_5xx = lineas_access.filter(l => / 5\d\d /.test(l)).length
    const errores_4xx = lineas_access.filter(l => / 4\d\d /.test(l)).length
    const ok_2xx = lineas_access.filter(l => / 2\d\d /.test(l)).length

    const ips: Record<string, number> = {}
    for (const linea of lineas_access) {
      const ip = linea.split(' ')[0]
      if (ip) ips[ip] = (ips[ip] || 0) + 1
    }
    const top_ips = Object.entries(ips)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, requests]) => ({ ip, requests }))

    return {
      access: {
        total_requests: lineas_access.length,
        ok_2xx,
        errores_4xx,
        errores_5xx,
        estado: errores_5xx > 10 ? 'CRITICO' : errores_5xx > 0 ? 'ALERTA' : 'LIMPIO',
        color: errores_5xx > 10 ? 'rojo' : errores_5xx > 0 ? 'amarillo' : 'verde',
        top_ips,
      },
      errores: analizarLogs(error, 'nginx_error'),
    }
  } catch {
    return { disponible: false }
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-audit-secret')
  if (secret !== AUDIT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [
    logs_panel, logs_gestor, logs_gestor_worker, logs_master,
    logs_bot, logs_evolution, nginx
  ] = await Promise.all([
    getPm2Logs('panel').then(l => analizarLogs(l, 'panel')),
    getPm2Logs('gestor').then(l => analizarLogs(l, 'gestor')),
    getPm2Logs('gestor-worker').then(l => analizarLogs(l, 'gestor-worker')),
    getPm2Logs('master').then(l => analizarLogs(l, 'master')),
    getDockerLogs('bot').then(l => analizarLogs(l, 'bot')),
    getDockerLogs('evolution').then(l => analizarLogs(l, 'evolution')),
    getNginxLogs(),
  ])

  const todos = [logs_panel, logs_gestor, logs_gestor_worker, logs_master, logs_bot, logs_evolution]
  const criticos_total = todos.reduce((a, b) => a + b.errores_criticos, 0)
  const errores_total = todos.reduce((a, b) => a + b.errores_normales, 0)
  const alertas_total = todos.reduce((a, b) => a + b.alertas, 0)

  const score = criticos_total > 0 ? 40
    : errores_total > 20 ? 60
    : errores_total > 5 ? 80
    : errores_total > 0 ? 90
    : 100

  const servicios_criticos = todos.filter(s => s.estado === 'CRITICO').map(s => s.fuente)
  const servicios_alerta = todos.filter(s => s.estado === 'ALERTA' || s.estado === 'REVISION').map(s => s.fuente)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    score: `${score}/100`,
    accion_requerida: criticos_total > 0 || errores_total > 5,
    resumen: criticos_total > 0
      ? `CRITICO: Errores graves en ${servicios_criticos.join(', ')} — atencion inmediata`
      : errores_total > 0
      ? `${errores_total} error(es) detectados en ${servicios_alerta.join(', ') || 'servicios'} — revision recomendada`
      : 'Todos los logs limpios — sin errores detectados',
    estadisticas: {
      criticos: criticos_total,
      errores: errores_total,
      alertas: alertas_total,
      servicios_criticos,
      servicios_en_revision: servicios_alerta,
    },
    pm2: { panel: logs_panel, gestor: logs_gestor, gestor_worker: logs_gestor_worker, master: logs_master },
    docker: { bot: logs_bot, evolution: logs_evolution },
    nginx,
  })
}
