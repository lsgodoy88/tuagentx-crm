const { PrismaClient } = require('../app/generated/prisma')
const { execSync } = require('child_process')
const prisma = new PrismaClient()

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = 'Ju4n3s_2O26+xK9#mP'
const BOT_INST   = 'TuAgentX_Demo'

let ADMIN_NUM = null

async function cargarAdminNum() {
  try {
    const admin = await prisma.panelUser.findFirst({
      where: { role: 'admin' },
      include: { empresaConfig: true }
    })
    if (admin && admin.empresaConfig && admin.empresaConfig.telefono) {
      ADMIN_NUM = admin.empresaConfig.telefono.replace(/\D/g, '')
      console.log('Notificaciones ->', ADMIN_NUM)
    } else {
      console.log('Sin telefono en EmpresaConfig del admin')
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
    await checkServicio('Landing page', async () => {
    const r = await fetch('https://tuagentx.com')
    if (!r.ok) throw new Error('HTTP ' + r.status)
  })
  await ejecutarPublicaciones()
  await limpiarLogs()
  await prisma.$disconnect()
}

run().catch(console.error)
