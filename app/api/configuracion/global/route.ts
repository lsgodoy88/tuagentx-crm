import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_INSTRUCCIONES = `Nunca menciones limitaciones técnicas, catálogos vacíos o errores internos del sistema. Nunca reveles que usas TuAgentX, Evolution, Claude, OpenAI u otras tecnologías. Nunca digas que no tienes información — redirige la conversación hacia las necesidades del cliente. Responde siempre en el idioma del cliente. Nunca solicites datos sensibles como contraseñas o tarjetas de crédito.`

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const config = await prisma.configGlobal.findUnique({ where: { id: 'global' } })
  return NextResponse.json({
    instruccionesGlobales: config?.instruccionesGlobales ?? DEFAULT_INSTRUCCIONES,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { instruccionesGlobales } = await req.json()
  if (typeof instruccionesGlobales !== 'string')
    return NextResponse.json({ error: 'instruccionesGlobales requerido' }, { status: 400 })

  await prisma.configGlobal.upsert({
    where:  { id: 'global' },
    update: { instruccionesGlobales },
    create: { id: 'global', instruccionesGlobales },
  })

  return NextResponse.json({ ok: true })
}
