import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({
    where: { email: user.email },
    include: { bots: true }
  })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
  const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

  let totalCreados = 0, totalOmitidos = 0

  for (const bot of panelUser.bots) {
    if (!bot.numero) continue
    try {
      const res = await fetch(`${EVO_URL}/chat/findContacts/${bot.instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
        body: JSON.stringify({ where: {} })
      })
      const contacts = await res.json()
      if (!Array.isArray(contacts)) continue
      for (const c of contacts) {
        if (!c.remoteJid || c.isGroup) continue
        const numero = c.remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
        if (!numero || numero.length < 7) continue
        try {
          await (prisma as any).contacto.upsert({
            where: { ownerId_numero: { ownerId: panelUser.id, numero } },
            update: { nombre: c.pushName || undefined },
            create: { ownerId: panelUser.id, numero, nombre: c.pushName || null }
          })
          totalCreados++
        } catch { totalOmitidos++ }
      }
    } catch(e) {
      console.log('Error sincronizando', bot.instance, e)
    }
  }
  return NextResponse.json({ ok: true, creados: totalCreados, omitidos: totalOmitidos })
}
