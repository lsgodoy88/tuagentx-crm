import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVO_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVO_KEY = process.env.EVOLUTION_API_KEY || ''

export async function POST() {
  const ahora = new Date()

  const pendientes = await prisma.publicacion.findMany({
    where: {
      estado: 'programada',
      proximoEnvio: { lte: ahora }
    },
    include: { imagenes: { orderBy: { createdAt: 'asc' } } }
  })

  let enviados = 0

  for (const pub of pendientes) {
    if (!pub.imagenes.length) continue

    // Imagen actual según indiceActual
    const imagen = pub.imagenes[pub.indiceActual % pub.imagenes.length]

    const agentes = JSON.parse(pub.agentes || '[]') as string[]
    const canales = JSON.parse(pub.canales || '[]') as string[]

    for (const agente of agentes) {
      if (canales.includes('whatsapp')) {
        try {
          // Obtener contactos del agente
          let statusJidList: string[] = []
          try {
            const cr = await fetch(`${EVO_URL}/chat/findContacts/${agente}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
              body: JSON.stringify({ where: {} })
            })
            const contacts = await cr.json()
            statusJidList = (Array.isArray(contacts) ? contacts : [])
              .filter((c: any) => c.remoteJid && !c.isGroup)
              .map((c: any) => c.remoteJid.includes('@s.whatsapp.net')
                ? c.remoteJid
                : c.remoteJid.replace('@lid', '@s.whatsapp.net'))
              .slice(0, 500)
          } catch {}

          if (statusJidList.length === 0) statusJidList = ['573100000000@s.whatsapp.net']

          // Enviar imagen como estado WhatsApp
          await fetch(`${EVO_URL}/message/sendStatus/${agente}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
            body: JSON.stringify({
              type: 'image',
              content: imagen.imagenUrl,
              caption: imagen.caption || '',
              statusJidList,
              backgroundColor: '#000000'
            })
          })
          enviados++
        } catch(e) {
          console.log('Error enviando estado:', e)
        }
      }
    }

    // Marcar imagen como enviada
    await prisma.publicacionImagen.update({
      where: { id: imagen.id },
      data: { enviada: true, enviadaEl: ahora }
    })

    // Calcular próximo envío y avanzar índice
    const horas = pub.frecuencia === 'none' ? null
      : pub.frecuencia === '12h' ? 12
      : pub.frecuencia.endsWith('h') ? Number(pub.frecuencia.replace('h', '')) || 24
      : 24

    const nuevoIndice = pub.indiceActual + 1
    const todasEnviadas = nuevoIndice >= pub.imagenes.length

    if (!pub.bucle && todasEnviadas) {
      // Sin bucle y se acabaron las imágenes → pausar
      await prisma.publicacion.update({
        where: { id: pub.id },
        data: { estado: 'pausada', indiceActual: nuevoIndice }
      })
    } else {
      await prisma.publicacion.update({
        where: { id: pub.id },
        data: {
          indiceActual: todasEnviadas ? 0 : nuevoIndice,
          bucleCount: todasEnviadas ? pub.bucleCount + 1 : pub.bucleCount,
          proximoEnvio: horas ? new Date(ahora.getTime() + horas * 3600000) : null,
        }
      })
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
