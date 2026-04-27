import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email } })
  if (!panelUser) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { id, instancias, canales, imagenFinal, copy } = await req.json()
  const resultados: any[] = []

  // WhatsApp Estados
  if (canales.includes('whatsapp') && instancias?.length > 0) {
    for (const instancia of instancias) {
      try {
        const base64 = imagenFinal.split(',')[1]
        // Guardar imagen temporalmente para servirla como URL
        const fs = require('fs')
        const path = require('path')
        const imgName = 'estado_' + Date.now() + '.jpg'
        const imgDir = '/srv/whatsapp-stack/media/' + instancia
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })
        const imgPath = imgDir + '/' + imgName
        fs.writeFileSync(imgPath, Buffer.from(base64, 'base64'))
        const imgUrl = 'https://panel.tuagentx.com/media/' + instancia + '/' + imgName

        // Obtener contactos para statusJidList
        let statusJidList: string[] = []
        try {
          const contactsRes = await fetch(`${EVO_URL}/chat/findContacts/${instancia}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
            body: JSON.stringify({ where: {} })
          })
          const contacts = await contactsRes.json()
          statusJidList = (Array.isArray(contacts) ? contacts : [])
            .filter((c: any) => c.remoteJid && !c.isGroup)
            .map((c: any) => c.remoteJid.includes('@s.whatsapp.net') ? c.remoteJid : c.remoteJid.replace('@lid', '@s.whatsapp.net'))
            .slice(0, 500)
        } catch(e) { console.log('Error obteniendo contactos:', e) }
        if (statusJidList.length === 0) statusJidList = ['573100000000@s.whatsapp.net']

        const res = await fetch(`${EVO_URL}/message/sendStatus/${instancia}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
          body: JSON.stringify({
            type: 'image',
            content: imgUrl,
            caption: copy,
            statusJidList,
            backgroundColor: '#000000'
          })
        })
        // Limpiar imagen temporal después de 5 min
        setTimeout(() => { try { fs.unlinkSync(imgPath) } catch {} }, 300000)
        const data = await res.json()
        console.log('sendStatus result:', JSON.stringify(data))
        resultados.push({ canal: 'whatsapp', instancia, ok: res.ok, data })
      } catch (e: any) {
        resultados.push({ canal: 'whatsapp', instancia, ok: false, error: e.message })
      }
    }
  }

  // Instagram — próximamente
  if (canales.includes('instagram')) {
    const cfg = await (prisma as any).empresaConfig.findUnique({ where: { userId: panelUser.id } })
    if (cfg?.igToken && cfg?.igAccountId) {
      // TODO: Meta Graph API
      resultados.push({ canal: 'instagram', ok: false, error: 'Próximamente — configura tu token de Instagram' })
    } else {
      resultados.push({ canal: 'instagram', ok: false, error: 'Configura tu cuenta de Instagram en Configuración' })
    }
  }

  // Facebook — próximamente
  if (canales.includes('facebook')) {
    resultados.push({ canal: 'facebook', ok: false, error: 'Próximamente — configura tu página de Facebook' })
  }

  if (id) {
    await (prisma as any).marketing.update({
      where: { id },
      data: { estado: 'publicado', publicadoEl: new Date() }
    })
  }

  return NextResponse.json({ resultados })
}
