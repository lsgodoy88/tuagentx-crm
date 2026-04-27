import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL    = 'http://localhost:8080'
const EVO_APIKEY = process.env.EVOLUTION_API_KEY!

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  try {
    // Verificar estado de conexión
    const statusRes = await fetch(`${EVO_URL}/instance/connectionState/${bot.instance}`, {
      headers: { 'apikey': EVO_APIKEY }
    })
    const statusData = await statusRes.json()
    const state = statusData?.instance?.state || statusData?.state || 'close'

    if (state === 'open') {
      // Obtener info del número conectado
      const infoRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVO_APIKEY }
      })
      const instances = await infoRes.json()
      const inst = Array.isArray(instances) ? instances.find((i: any) => i.name === bot.instance) : null
      const ownerJid = inst?.ownerJid || ''
      const numero = ownerJid.replace('@s.whatsapp.net', '')
      const perfil = inst?.profileName || ''

      // Guardar en BD
      await prisma.bot.update({
        where: { id },
        data: { activo: true, numero: numero || null, perfil: perfil || null }
      })

      return NextResponse.json({ conectado: true, state, numero, perfil })
    }

    // Obtener QR
    const qrRes = await fetch(`${EVO_URL}/instance/connect/${bot.instance}`, {
      headers: { 'apikey': EVO_APIKEY }
    })
    const qrData = await qrRes.json()
    const base64 = qrData?.base64 || qrData?.qrcode?.base64 || null

    return NextResponse.json({ conectado: false, state, base64 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
