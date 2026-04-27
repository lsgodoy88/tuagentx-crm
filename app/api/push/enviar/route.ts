import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@tuagentx.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function POST(req: NextRequest) {
  const isInternal = req.headers.get('x-internal') === 'push'
  if (!isInternal) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { userIds, titulo, cuerpo, url } = await req.json()

  const suscripciones = await prisma.pushSuscripcion.findMany({
    where: userIds ? { userId: { in: userIds } } : {}
  })

  let enviados = 0
  for (const sus of suscripciones) {
    try {
      await webpush.sendNotification(
        { endpoint: sus.endpoint, keys: { p256dh: sus.p256dh, auth: sus.auth } },
        JSON.stringify({ titulo, cuerpo, url: url || '/dashboard' })
      )
      enviados++
    } catch(e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        await prisma.pushSuscripcion.delete({ where: { id: sus.id } })
      }
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
