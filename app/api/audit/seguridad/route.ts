import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)
const AUDIT_SECRET = process.env.AUDIT_SECRET

// Patrones peligrosos en logs y archivos
const PATRONES_SECRETOS = [
  'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY',
  'DATABASE_URL', 'REDIS_URL', 'WEBHOOK_SECRET', 'NEXTAUTH_SECRET'
]

const ENDPOINTS_PUBLICOS_PERMITIDOS = [
  '/api/auth', '/api/wompi/webhook', '/api/mantenimiento/ejecutar',
  '/api/pagos/crear-link', '/api/checkout', '/api/cotizador/checkout',
  '/api/checkout/validar-whatsapp', '/api/email/audit',
  '/api/audit/velocidad', '/api/audit/seguridad',
  '/api/audit/rendimiento', '/api/audit/logs', '/api/audit/mejoras'
]

async function verificarSecretsEnLogs(): Promise<{ ok: boolean, hallazgos: string[] }> {
  const hallazgos: string[] = []
  try {
    const { stdout } = await execAsync('pm2 logs --nostream --lines 50 2>/dev/null || echo ""')
    for (const patron of PATRONES_SECRETOS) {
      const regex = new RegExp(patron + '[:=\\s][a-zA-Z0-9_\\-\\.]{8,}', 'gi')
      const matches = stdout.match(regex)
      if (matches) hallazgos.push(`Posible secret en logs PM2: ${patron}`)
    }
  } catch { }
  return { ok: hallazgos.length === 0, hallazgos }
}

async function verificarEnvFiles(): Promise<{ ok: boolean, hallazgos: string[] }> {
  const hallazgos: string[] = []
  const proyectos = ['/srv/panel', '/srv/gestor', '/srv/master']
  for (const proyecto of proyectos) {
    // Verificar que .env no sea accesible publicamente
    try {
      const stat = fs.statSync(`${proyecto}/.env`)
      const mode = (stat.mode & 0o777).toString(8)
      if (mode !== '600' && mode !== '640' && mode !== '644') {
        hallazgos.push(`${proyecto}/.env tiene permisos ${mode} — recomendado 600`)
      }
    } catch { }
    // Verificar que .env no este en git
    try {
      const { stdout } = await execAsync(`cd ${proyecto} && git ls-files .env 2>/dev/null`)
      if (stdout.trim()) hallazgos.push(`${proyecto}/.env esta trackeado en git — CRITICO`)
    } catch { }
  }
  return { ok: hallazgos.length === 0, hallazgos }
}

async function verificarHeaders(): Promise<{ ok: boolean, hallazgos: string[] }> {
  const hallazgos: string[] = []
  try {
    const { stdout } = await execAsync('curl -s -I http://localhost:3000/api/bots -o /dev/null -D - 2>/dev/null || echo ""')
    const headers = stdout.toLowerCase()
    if (!headers.includes('x-content-type-options')) hallazgos.push('Falta header X-Content-Type-Options en panel')
    if (!headers.includes('x-frame-options')) hallazgos.push('Falta header X-Frame-Options en panel')
    if (headers.includes('x-powered-by')) hallazgos.push('Header X-Powered-By expuesto — revela tecnologia del servidor')
  } catch { }
  return { ok: hallazgos.length === 0, hallazgos }
}

async function verificarPuertos(): Promise<{ ok: boolean, hallazgos: string[] }> {
  const hallazgos: string[] = []
  try {
    const { stdout } = await execAsync('ss -tlnp 2>/dev/null | grep LISTEN')
    const lineas = stdout.split("\n").filter(Boolean)
    for (const linea of lineas) {
      // Puertos internos expuestos publicamente
      if (linea.includes('0.0.0.0:3000') || linea.includes('0.0.0.0:3010') || linea.includes('0.0.0.0:3020')) {
        const puerto = linea.match(/0\.0\.0\.0:(\d+)/)?.[1]
        if (puerto) hallazgos.push(`Puerto ${puerto} escuchando en 0.0.0.0 — deberia ser solo 127.0.0.1 (protegido por nginx)`)
      }
    }
  } catch { }
  return { ok: hallazgos.length === 0, hallazgos }
}

async function verificarNginx(): Promise<{ ok: boolean, hallazgos: string[] }> {
  const hallazgos: string[] = []
  try {
    const { stdout } = await execAsync('nginx -t 2>&1')
    if (!stdout.includes('ok')) hallazgos.push('Configuracion nginx con errores — verificar manualmente')
    // Verificar SSL
    const { stdout: nginx_conf } = await execAsync('cat /etc/nginx/sites-enabled/* 2>/dev/null || echo ""')
    if (!nginx_conf.includes('ssl_certificate')) hallazgos.push('No se detecta SSL en nginx — HTTPS no configurado')
    if (!nginx_conf.includes('add_header Strict-Transport-Security')) hallazgos.push('Falta HSTS en nginx')
  } catch { }
  return { ok: hallazgos.length === 0, hallazgos }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-audit-secret')
  if (secret !== AUDIT_SECRET)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [secrets_logs, env_files, headers, puertos, nginx] = await Promise.all([
    verificarSecretsEnLogs(),
    verificarEnvFiles(),
    verificarHeaders(),
    verificarPuertos(),
    verificarNginx(),
  ])

  const checks = { secrets_logs, env_files, headers, puertos, nginx }
  const totalChecks = Object.keys(checks).length
  const checksOk = Object.values(checks).filter(c => c.ok).length
  const score = Math.round((checksOk / totalChecks) * 100)

  const todosHallazgos = Object.entries(checks)
    .filter(([, v]) => !v.ok)
    .flatMap(([k, v]) => v.hallazgos.map(h => ({ categoria: k, hallazgo: h })))

  const criticos = todosHallazgos.filter(h =>
    h.hallazgo.includes('CRITICO') || h.hallazgo.includes('git') || h.hallazgo.includes('HTTPS')
  )

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    score: `${score}/100`,
    accion_requerida: todosHallazgos.length > 0,
    resumen: criticos.length > 0
      ? `CRITICO: ${criticos.length} vulnerabilidad(es) requieren atencion inmediata`
      : todosHallazgos.length > 0
      ? `${todosHallazgos.length} hallazgo(s) de seguridad — revision recomendada`
      : 'Sin hallazgos de seguridad — todo en orden',
    checks: {
      secrets_en_logs: { ...secrets_logs, descripcion: 'Secrets o API keys expuestas en logs de PM2' },
      archivos_env: { ...env_files, descripcion: 'Permisos y tracking git de archivos .env' },
      headers_http: { ...headers, descripcion: 'Headers de seguridad en responses HTTP' },
      puertos_red: { ...puertos, descripcion: 'Puertos internos expuestos a red publica' },
      nginx_ssl: { ...nginx, descripcion: 'Configuracion SSL y headers de seguridad en nginx' },
    },
    hallazgos: todosHallazgos,
    criticos,
  })
}
