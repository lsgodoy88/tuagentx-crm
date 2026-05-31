const { PrismaClient } = require('../app/generated/prisma')
const { execSync } = require('child_process')
const prisma = new PrismaClient()

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = 'Ju4n3s_2O26+xK9#mP'
const BOT_INST   = 'TuAgentX_Demo'

let ADMIN_NUM = null

async function cargarAdminNum() {
  try {
    // Buscar admin con telefono configurado (puede haber varios admins, pero uno solo con telefono)
    const admin = await prisma.panelUser.findFirst({
      where: {
        role: 'admin',
        empresaConfig: { telefono: { not: null } }
      },
      include: { empresaConfig: true }
    })
    if (admin && admin.empresaConfig && admin.empresaConfig.telefono) {
      ADMIN_NUM = admin.empresaConfig.telefono.replace(/\D/g, '')
      console.log('Notificaciones ->', ADMIN_NUM, '(' + admin.email + ')')
    } else {
      // Sin telefono — se notifica via banner en el dashboard, no en logs
    }
  } catch(e) {
    console.log('Error cargando admin:', e.message)
  }
}

async function notificarWhatsApp(msg) {
  if (!ADMIN_NUM) return
  try {
    await fetch(EVO_URL + '/message/sendText/' + BOT_INST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_APIKEY },
      body: JSON.stringify({ number: ADMIN_NUM, text: msg })
    })
  } catch(e) {
    console.log('No se pudo notificar WA:', e.message)
  }
}

async function autoRecuperar(nombre) {
  try {
    if (nombre === 'Panel Next.js') {
      execSync('pm2 restart panel', { timeout: 15000 })
      return 'pm2 restart panel ejecutado'
    }
    if (nombre === 'Gestor Next.js') {
      execSync('pm2 restart gestor', { timeout: 15000 })
      return 'pm2 restart gestor ejecutado'
    }
    if (nombre === 'Gestor Staging') {
      execSync('pm2 restart gestor-staging', { timeout: 15000 })
      return 'pm2 restart gestor-staging ejecutado'
    }
    if (nombre === 'Master Next.js') {
      execSync('pm2 restart master', { timeout: 15000 })
      return 'pm2 restart master ejecutado'
    }
    if (nombre === 'Worker BullMQ') {
      execSync('pm2 restart gestor-worker', { timeout: 15000 })
      return 'pm2 restart gestor-worker ejecutado'
    }
    if (nombre === 'Redis') {
      execSync('cd /srv/whatsapp-stack && docker compose restart redis', { timeout: 30000 })
      return 'docker restart redis ejecutado'
    }
    if (nombre === 'Bot WhatsApp') {
      execSync('cd /srv/whatsapp-stack && docker compose restart bot', { timeout: 30000 })
      return 'docker restart bot ejecutado'
    }
    if (nombre === 'Evolution API') {
      execSync('cd /srv/whatsapp-stack && docker compose restart evolution', { timeout: 30000 })
      return 'docker restart evolution ejecutado'
    }
    if (nombre === 'rembg') {
      execSync('pm2 restart rembg', { timeout: 15000 })
      return 'pm2 restart rembg ejecutado'
    }
  } catch(e) {
    return 'Auto-recuperacion fallo: ' + e.message
  }
  return null
}

async function checkServicio(nombre, fn) {
  try {
    await fn()
    const incidente = await prisma.incidente.findFirst({ where: { servicio: nombre, resuelto: false } })
    if (incidente) {
      await prisma.incidente.update({ where: { id: incidente.id }, data: { resuelto: true, fin: new Date() } })
      console.log(nombre + ' recuperado')
      await notificarWhatsApp('TuAgentX Monitor\n\n' + nombre + ' se ha recuperado automaticamente.\n\n' + new Date().toLocaleString('es-CO'))
    }
  } catch(e) {
    const existe = await prisma.incidente.findFirst({ where: { servicio: nombre, resuelto: false } })
    if (!existe) {
      const accion = await autoRecuperar(nombre)
      await prisma.incidente.create({ data: { servicio: nombre, error: e.message || 'Error desconocido' } })
      console.log(nombre + ' CAIDO: ' + e.message)
      await notificarWhatsApp('TuAgentX Alerta\n\n' + nombre + ' esta caido.\nError: ' + e.message + '\n' + (accion || 'Sin auto-recuperacion') + '\n\n' + new Date().toLocaleString('es-CO'))
    }
  }
}

async function ejecutarPublicaciones() {
  try {
    const r = await fetch('http://localhost:3000/api/publicaciones/ejecutar', { method: 'POST' })
    const d = await r.json()
    if (d.enviados > 0) console.log(d.enviados + ' publicaciones enviadas')
  } catch(e) { console.log('Error ejecutando publicaciones:', e.message) }
}

async function limpiarLogs() {
  const hace7dias  = new Date(Date.now() - 7  * 86400000)
  const hace30dias = new Date(Date.now() - 30 * 86400000)
  const botLogs    = await prisma.botLog.deleteMany({ where: { createdAt: { lt: hace7dias } } })
  const incidentes = await prisma.incidente.deleteMany({ where: { inicio: { lt: hace30dias }, resuelto: true } })
  if (botLogs.count > 0)    console.log(botLogs.count + ' BotLogs eliminados')
  if (incidentes.count > 0) console.log(incidentes.count + ' Incidentes eliminados')
}

// ── CPU thresholds ────────────────────────────────────────────────
const STEAL_WARN    = 20   // % steal — alerta, monitorear
const STEAL_CRIT    = 50   // % steal — emergencia nivel 1
const STEAL_EXTREME = 80   // % steal — emergencia nivel 2
const CPU_USER_CRIT = 80   // % user — proceso propio disparado

// Estado para no spamear ni re-ejecutar acciones
let cpuEstado = null  // null | 'warn' | 'crit' | 'extreme'

function matarBuildsZombie() {
  try {
    // pkill -f mata directamente sin necesidad de parsear PIDs
    execSync("pkill -9 -f 'next build' 2>/dev/null || true", { timeout: 3000 })
    // Verificar si quedaron
    const quedaron = execSync("pgrep -c -f 'next build' || echo 0", { timeout: 3000 }).toString().trim()
    if (quedaron === '0') {
      console.log('[CPU] Builds zombie eliminados')
      return 'Builds zombie eliminados'
    }
    return null
  } catch(e) { return null }
}

function limpiarDockerMuertos() {
  try {
    execSync('docker container prune -f 2>/dev/null || true', { timeout: 10000 })
    console.log('[CPU] Docker containers muertos limpiados')
    return 'Docker containers muertos limpiados'
  } catch(e) { return null }
}

function matarProcesosAltaCPU(threshold = 70) {
  // Mata procesos con >threshold% CPU que no sean servicios críticos
  const SAFE = ['pm2', '.pm2', 'next-server', 'postgres', 'redis', 'dockerd', 'containerd', 'monitor', 'sysstat', 'sar', 'vmstat', 'ps ']
  try {
    const lines = execSync(
      "ps aux --sort=-%cpu | awk 'NR>1 && NR<=20 {print $2"|"$3"|"$11}'",
      { timeout: 3000 }
    ).toString().trim().split('\n')
    const matados = []
    for (const line of lines) {
      const parts = line.split('|')
      if (parts.length < 3) continue
      const [pid, cpu, cmd] = parts
      const cpuN = parseFloat(cpu)
      if (!pid || !cpuN || cpuN < threshold) continue
      const esSafe = SAFE.some(s => cmd && cmd.includes(s))
      if (esSafe) continue
      try { execSync('kill -15 ' + pid.trim() + ' 2>/dev/null || true', { timeout: 2000 }) } catch(e) {}
      matados.push(cmd + '(' + pid + ') ' + cpu + '%')
    }
    if (matados.length) {
      console.log('[CPU] Procesos altos matados:', matados.join(', '))
      return 'Procesos altos matados: ' + matados.join(', ')
    }
    return null
  } catch(e) { return null }
}

async function checkCPU() {
  try {
    const out = execSync('vmstat 1 2', { timeout: 5000 }).toString()
    const cols = out.trim().split('\n').pop().trim().split(/\s+/)
    const us = parseFloat(cols[12]) || 0
    const sy = parseFloat(cols[13]) || 0
    const id = parseFloat(cols[14]) || 0
    const st = parseFloat(cols[16]) || 0
    const usado = us + sy
    const ts = new Date().toLocaleString('es-CO')
    console.log('[CPU] user=' + us + '% sys=' + sy + '% idle=' + id + '% steal=' + st + '%')

    // Nivel 0: CPU propia alta sin steal
    if (st < STEAL_WARN && usado >= CPU_USER_CRIT && cpuEstado !== 'user_crit') {
      cpuEstado = 'user_crit'
      const zombie = matarBuildsZombie()
      let top5 = ''
      try { top5 = execSync("ps aux --sort=-%cpu | awk 'NR>1 && NR<=6 {print $3\"% \"$11}'", { timeout: 3000 }).toString().trim().replace(/\n/g,' ') } catch(e2) {}
      await notificarWhatsApp(
        'ALERTA CPU alta\n\n' +
        'CPU propio: ' + usado.toFixed(1) + '% | Steal: ' + st + '%\n' +
        (top5 ? 'Top: ' + top5 + '\n' : '') +
        (zombie ? '\nAccion: ' + zombie + '\n' : '') +
        '\n' + ts
      )
      return
    }

    // Nivel 1: Steal critico
    if (st >= STEAL_CRIT && st < STEAL_EXTREME && cpuEstado !== 'crit' && cpuEstado !== 'extreme') {
      cpuEstado = 'crit'
      const acciones = []
      const z = matarBuildsZombie(); if (z) acciones.push(z)
      const d = limpiarDockerMuertos(); if (d) acciones.push(d)
      await notificarWhatsApp(
        'ALERTA CPU Critica\n\n' +
        'Steal: ' + st + '% | CPU: ' + usado.toFixed(1) + '% | Idle: ' + id + '%\n\n' +
        'VPS throttleado por el hypervisor.\n' +
        (acciones.length ? '\nAcciones:\n' + acciones.map(function(a){return '- '+a}).join('\n') + '\n' : '') +
        '\n' + ts
      )
      return
    }

    // Nivel 2: Steal extremo — emergencia total
    if (st >= STEAL_EXTREME && cpuEstado !== 'extreme') {
      cpuEstado = 'extreme'
      const acciones = []
      const z = matarBuildsZombie(); if (z) acciones.push(z)
      const d = limpiarDockerMuertos(); if (d) acciones.push(d)
      const p = matarProcesosAltaCPU(70); if (p) acciones.push(p)
      try { execSync('rm -rf /srv/gestor/.next/cache/webpack 2>/dev/null || true', { timeout: 5000 }); acciones.push('Cache webpack limpiado') } catch(e2) {}
      await notificarWhatsApp(
        'EMERGENCIA CPU\n\n' +
        'Steal: ' + st + '% | CPU: ' + usado.toFixed(1) + '% | Idle: ' + id + '%\n\n' +
        'Servidor en estado critico.\n' +
        '\nAcciones de emergencia:\n' +
        (acciones.length ? acciones.map(function(a){return '- '+a}).join('\n') : '- Ninguna disponible') +
        '\n\nSi persiste, revisar el proveedor VPS.\n\n' + ts
      )
      return
    }

    // Normal: resetear estado
    if (st < STEAL_WARN && usado < CPU_USER_CRIT && cpuEstado) {
      console.log('[CPU] Normalizado — estado anterior: ' + cpuEstado)
      cpuEstado = null
    }

  } catch(e) {
    console.log('Error checkCPU:', e.message)
  }
}

async function run() {
  await cargarAdminNum()
  await checkServicio('Bot WhatsApp', async () => {
    const r = await fetch('http://localhost:3001/health')
    if (!r.ok) throw new Error('No responde')
  })
  await checkServicio('Evolution API', async () => {
    const r = await fetch(EVO_URL + '/instance/fetchInstances', { headers: { apikey: EVO_APIKEY } })
    if (!r.ok) throw new Error('HTTP ' + r.status)
  })
  await checkServicio('PostgreSQL', async () => {
    await prisma.$queryRaw`SELECT 1`
  })
  await checkServicio('Panel Next.js', async () => {
    const r = await fetch('http://localhost:3000/api/auth/providers')
    if (!r.ok) throw new Error('HTTP ' + r.status)
  })
  await checkServicio('Gestor Next.js', async () => {
    const r = await fetch('http://localhost:3010/api/health')
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const d = await r.json()
    if (!d.healthy) throw new Error('Health check fallo: ' + JSON.stringify(d.checks))
  })
  await checkServicio('Gestor Staging', async () => {
    const r = await fetch('http://localhost:3011/api/version')
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const d = await r.json()
    if (d.env !== 'staging') throw new Error('env inesperado: ' + d.env)
  })
  await checkServicio('Master Next.js', async () => {
    const r = await fetch('http://localhost:3020/')
    if (!r.ok && r.status !== 401) throw new Error('HTTP ' + r.status)
  })
  await checkServicio('Worker BullMQ', async () => {
    // Verificar via PM2 que el proceso esté online
    const out = execSync('pm2 jlist', { timeout: 5000 }).toString()
    const procs = JSON.parse(out)
    const worker = procs.find(p => p.name === 'gestor-worker')
    if (!worker) throw new Error('Worker no encontrado en PM2')
    if (worker.pm2_env.status !== 'online') throw new Error('Estado: ' + worker.pm2_env.status)
  })
  await checkServicio('Redis', async () => {
    const out = execSync('docker exec redis redis-cli ping', { timeout: 5000 }).toString().trim()
    if (out !== 'PONG') throw new Error('No PONG: ' + out)
  })
  await checkServicio('Cron 5am UpTres', async () => {
    // Verificar que el último sync no tiene más de 26 horas
    const r = await fetch('http://localhost:3010/api/health')
    const d = await r.json()
    if (d.checks?.lastSync && !d.checks.lastSync.ok) {
      throw new Error('Ultimo sync hace ' + d.checks.lastSync.hours + 'h (max 26h)')
    }
  })
    await checkServicio('Landing page', async () => {
    const r = await fetch('https://tuagentx.com')
    if (!r.ok) throw new Error('HTTP ' + r.status)
  })
  await checkCPU()
  await ejecutarPublicaciones()
  await limpiarLogs()
  await prisma.$disconnect()
}

run().catch(console.error)
