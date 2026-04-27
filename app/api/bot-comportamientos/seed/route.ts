import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidarCacheComportamientos } from '@/lib/redis'

const DEFAULTS = [
  { trigger: 'Soy nuevo',        tipo: 'PALABRA_CLAVE', prioridad: 10, accion: 'CAMBIAR_ESTADO:NUEVO',
    respuesta: '🎉 ¡Bienvenido a TuAgentX! Soy Sofía, tu asistente comercial.\n\nTe cuento: con TuAgentX puedes tener un bot de WhatsApp con IA atendiendo a tus clientes 24/7, como yo lo hago ahora contigo. 🤖\n\n¿Qué tipo de negocio tienes?' },
  { trigger: 'precio',           tipo: 'PALABRA_CLAVE', prioridad: 9, accion: 'CAMBIAR_ESTADO:INTERESADO',
    respuesta: '💰 Nuestros planes desde *$49.900/mes*:\n\n📦 *Básico* — 1 bot, catálogo, IA\n🚀 *Pro* — 2 bots + reportes\n💼 *Business* — 3 bots + todo incluido\n\n¿Cuál se adapta mejor a tu negocio?' },
  { trigger: 'demo',             tipo: 'PALABRA_CLAVE', prioridad: 9, accion: 'CAMBIAR_ESTADO:DEMO',
    respuesta: '🎯 ¡Perfecto! Puedo darte una demo en vivo ahora mismo.\n\nVisita 👉 *crm.tuagentx.com/demo* e ingresa el producto que vendes. En segundos verás tu propio bot en acción. ¿Lo intentamos?' },
  { trigger: 'contratar',        tipo: 'PALABRA_CLAVE', prioridad: 10, accion: 'CAMBIAR_ESTADO:CLIENTE',
    respuesta: '🙌 ¡Excelente decisión! Para activar tu cuenta entra a:\n👉 *crm.tuagentx.com*\n\nEn menos de 5 minutos tu bot estará listo. ¿Tienes alguna duda antes de empezar?' },
  { trigger: 'no me interesa',   tipo: 'PALABRA_CLAVE', prioridad: 8, accion: 'CAMBIAR_ESTADO:FRIO',
    respuesta: '😊 Entendido, no hay problema. Si en algún momento quieres explorar cómo la IA puede ayudar a tu negocio, aquí estaré. ¡Que te vaya muy bien!' },
  { trigger: 'soporte',          tipo: 'PALABRA_CLAVE', prioridad: 9, accion: 'CAMBIAR_ESTADO:SOPORTE',
    respuesta: '🛠️ Te conecto con nuestro equipo de soporte:\n📧 soporte@tuagentx.com\n💬 O escribe a nuestro canal de ayuda.\n\n¿Me puedes describir el problema para dárselo al equipo?' },
  { trigger: 'INSATISFECHO',     tipo: 'INTENCION',     prioridad: 10, accion: 'CAMBIAR_ESTADO:MOLESTO',
    respuesta: '😔 Lamento que te sientas así. Entiendo tu frustración y quiero ayudarte.\n\nVoy a escalar esto a un asesor humano que te atenderá personalmente. ¿Puedes contarme un poco más sobre lo que pasó?' },
  { trigger: 'QUIERE_COMPRAR',   tipo: 'INTENCION',     prioridad: 10, accion: 'CAMBIAR_ESTADO:CLIENTE',
    respuesta: '🎉 ¡Me alegra mucho! Para completar tu registro:\n👉 *crm.tuagentx.com/pago*\n\nEl proceso tarda menos de 3 minutos y tu bot queda activo inmediatamente. ¿Necesitas ayuda con algo?' },
  { trigger: 'MOLESTO',          tipo: 'ESTADO',        prioridad: 10, accion: 'ESCALAR',
    respuesta: '🤝 Entiendo perfectamente tu situación. Me voy a asegurar que un asesor humano te contacte hoy mismo para resolver esto.\n\n¿Me das tu nombre para comunicárselo al equipo?' },
  { trigger: 'SOPORTE',          tipo: 'ESTADO',        prioridad: 9,  accion: null,
    respuesta: '🛠️ Estoy aquí para ayudarte. Nuestro equipo técnico está disponible:\n📧 soporte@tuagentx.com\n⏰ Lunes a viernes 8am–6pm\n\nDescríbeme el problema con el mayor detalle posible.' },
  { trigger: 'FRIO',             tipo: 'ESTADO',        prioridad: 5,  accion: null,
    respuesta: '👋 ¡Hola de nuevo! El mundo del e-commerce cambia rápido.\n\n¿Sabías que los negocios con bot de WhatsApp venden hasta 3x más? Si quieres explorar opciones sin compromiso, estoy aquí. 😊' },
]

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'admin') return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const count = await prisma.botComportamiento.count()
  if (count > 0) return NextResponse.json({ ok: false, mensaje: 'Ya existen comportamientos. No se sobreescribieron.', count })

  await prisma.botComportamiento.createMany({ data: DEFAULTS })
  await invalidarCacheComportamientos()
  return NextResponse.json({ ok: true, creados: DEFAULTS.length })
}
