import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const c = (bot.config as Record<string, any>) || {}

  return NextResponse.json({
    ok: true,
    data: {
      tipo:              bot.tipo            || null,
      tipo_negocio:      c.tipo_negocio      || null,
      configurado:       bot.configurado     ?? false,
      nombre_empresa:    c.nombre_empresa    || '',
      nombre_agente:     c.nombre_agente     || '',
      personalidad:      c.personalidad      || '',
      idioma:            c.idioma            || 'español',
      numero_escalado:   c.numero_escalado   || '',
      conocimiento_base: c.conocimiento_base || '',
      caracteristicas:   c.caracteristicas   || '[]',
      condiciones:       c.condiciones       || '[]',
      posventa_activa:               c.posventa_activa,
      posventa_mensaje_bienvenida:   c.posventa_mensaje_bienvenida   || '',
      posventa_intentos_cancelacion: c.posventa_intentos_cancelacion,
      posventa_mensaje_seguimiento:  c.posventa_mensaje_seguimiento  || '',
      catalogo:  (c.catalogo  || []).map((r: any) => ({ nombre: r.nombre||'', descripcion: r.descripcion||'', precio: r.precio||'', imagen: r.imagen||'', disponible: r.disponible||'si' })),
      politicas: (c.politicas || []).map((r: any) => ({ titulo: r.titulo||'', contenido: r.contenido||'' })),
      primerProducto: c.primerProducto || null,
      faq:       (c.faq       || []).map((r: any) => ({ pregunta: r.pregunta||'', respuesta: r.respuesta||'' })),
    },
  })
}
