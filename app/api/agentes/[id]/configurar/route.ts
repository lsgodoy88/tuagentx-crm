import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const bot = await prisma.bot.findUnique({ where: { id } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const { config, catalogo, politicas, faq } = await req.json()

  try {
    // Construir el nuevo config JSONB
    const currentConfig = (bot.config as Record<string, any>) || {}

    const newConfig: Record<string, any> = {
      ...currentConfig,
    }

    if (config) {
      newConfig.nombre_empresa             = config.nombre_empresa            ?? currentConfig.nombre_empresa ?? ''
      newConfig.nombre_agente              = config.nombre_agente             ?? currentConfig.nombre_agente ?? ''
      newConfig.personalidad               = config.personalidad              ?? currentConfig.personalidad ?? ''
      newConfig.numero_escalado            = config.numero_escalado           ?? currentConfig.numero_escalado ?? ''
      newConfig.idioma                     = config.idioma                    ?? currentConfig.idioma ?? 'español'
      newConfig.activo                     = config.activo                    ?? currentConfig.activo ?? true
      newConfig.conocimiento_base          = config.conocimiento_base         ?? currentConfig.conocimiento_base ?? ''
      newConfig.caracteristicas            = config.caracteristicas           ?? currentConfig.caracteristicas ?? '[]'
      newConfig.condiciones                = config.condiciones               ?? currentConfig.condiciones ?? '[]'
      newConfig.posventa_activa            = config.posventa_activa           ?? currentConfig.posventa_activa ?? false
      newConfig.posventa_mensaje_bienvenida   = config.posventa_mensaje_bienvenida   ?? currentConfig.posventa_mensaje_bienvenida ?? ''
      newConfig.posventa_intentos_cancelacion = config.posventa_intentos_cancelacion ?? currentConfig.posventa_intentos_cancelacion ?? 3
      newConfig.posventa_mensaje_seguimiento  = config.posventa_mensaje_seguimiento  ?? currentConfig.posventa_mensaje_seguimiento ?? ''
      newConfig.primerProducto             = config.primerProducto            ?? currentConfig.primerProducto ?? ''
      newConfig.tipo_negocio               = config.tipo_negocio              ?? currentConfig.tipo_negocio ?? null
    }

    if (catalogo !== undefined) {
      newConfig.catalogo = catalogo
    } else if (config?.primerProducto) {
      // Inicializar catálogo con primerProducto solo si aún está vacío
      const catalogoActual = currentConfig.catalogo
      const catalogoVacio = !catalogoActual ||
        (Array.isArray(catalogoActual) && catalogoActual.length === 0)
      if (catalogoVacio) {
        const pp = config.primerProducto
        newConfig.catalogo = [{
          nombre:      pp.nombre         || '',
          descripcion: pp.caracteristicas || '',
          precio:      pp.precio          || '',
          codigo:      pp.codigo          || '',
          cantidad:    pp.cantidad        || '',
        }]
      }
    }
    if (politicas !== undefined) newConfig.politicas = politicas
    if (faq !== undefined)       newConfig.faq       = faq

    // Guardar todo en Bot.config JSONB + campos del bot
    await prisma.bot.update({
      where: { id },
      data: {
        config: newConfig,
        configurado: true,
        activo: config?.activo ?? bot.activo,
        name: config?.nombre_agente || bot.name,
        tipo: config?.tipo || bot.tipo || 'ventas',
      },
    })

    // Crear/actualizar producto en tabla Producto si viene primerProducto
    if (config?.primerProducto && bot.ownerId) {
      const pp = config.primerProducto
      const codigo = (pp.codigo && pp.codigo.trim()) ? pp.codigo.trim() : 'P001'
      await prisma.producto.upsert({
        where:  { codigo },
        update: {},   // si ya existe no sobreescribir
        create: {
          codigo,
          nombre:      pp.nombre          || '',
          descripcion: pp.caracteristicas || '',
          precio:      parseFloat(pp.precio)   || 0,
          stock:       parseInt(pp.cantidad)   || 0,
          ownerId:     bot.ownerId,
        },
      })
    }

    // Recargar prompt en el bot
    await fetch(`http://localhost:3001/reload/${encodeURIComponent(bot.instance)}`, { method: 'POST' }).catch(() => {})

    await audit('BOT_CONFIGURADO', session.user?.email || '', `Bot: ${bot.name} | Instancia: ${bot.instance}`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[POST /api/agentes/configurar] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
