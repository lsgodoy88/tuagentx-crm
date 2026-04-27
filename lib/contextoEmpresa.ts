import { prisma } from '@/lib/prisma'

export async function getContextoEmpresa(userId: string, tipoNegocio: string) {
  const [
    bots,
    ventas,
    contactos,
    productos,
    servicios,
    empresaConfig,
    publicaciones,
    botLogs,
  ] = await Promise.all([
    prisma.bot.findMany({
      where: { ownerId: userId },
      select: { name: true, instance: true, activo: true, numero: true, perfil: true, configurado: true },
    }),
    prisma.venta.findMany({
      where: { instance: { in: (await prisma.bot.findMany({ where: { ownerId: userId }, select: { instance: true } })).map((b: any) => b.instance) } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { cliente: true, producto: true, monto: true, estado: true, createdAt: true, ciudad: true },
    }),
    prisma.contacto.findMany({
      where: { ownerId: userId },
      select: { nombre: true, numero: true, etiqueta: true, createdAt: true },
      take: 100,
    }),
    tipoNegocio !== 'servicios' ? prisma.producto.findMany({
      where: { ownerId: userId },
      select: { nombre: true, precio: true, stock: true, activo: true, descripcion: true },
      take: 50,
    }) : Promise.resolve([]),
    tipoNegocio === 'servicios' ? prisma.servicio.findMany({
      where: { ownerId: userId },
      select: { nombre: true, precio: true, activo: true, descripcion: true },
      take: 50,
    }) : Promise.resolve([]),
    prisma.empresaConfig.findUnique({
      where: { ownerId: userId },
      select: { nombre: true, nit: true, telefono: true, direccion: true, ciudad: true, logo: true },
    }).catch(() => null),
    prisma.publicacion.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { titulo: true, estado: true, createdAt: true },
    }).catch(() => []),
    prisma.botLog.findMany({
      where: { instance: { in: (await prisma.bot.findMany({ where: { ownerId: userId }, select: { instance: true } })).map((b: any) => b.instance) } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { instance: true, evento: true, estado: true, createdAt: true, error: true },
    }).catch(() => []),
  ])

  // Formatear datos — sin campos sensibles
  const totalVentas = ventas.reduce((a: number, v: any) => a + (v.monto || 0), 0)
  const ventasPorEstado = ventas.reduce((acc: any, v: any) => {
    acc[v.estado] = (acc[v.estado] || 0) + 1
    return acc
  }, {})

  return {
    bots: bots.map((b: any) => ({
      nombre: b.name,
      instance: b.instance,
      activo: b.activo,
      configurado: b.configurado,
      numero: b.numero || 'sin número',
    })),
    ventas: {
      total: totalVentas,
      cantidad: ventas.length,
      porEstado: ventasPorEstado,
      recientes: ventas.slice(0, 10).map((v: any) => ({
        cliente: v.cliente,
        producto: v.producto,
        monto: v.monto,
        estado: v.estado,
        fecha: new Date(v.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
      })),
    },
    contactos: {
      total: contactos.length,
      lista: contactos.slice(0, 20).map((c: any) => ({ nombre: c.nombre, numero: c.numero, etiqueta: c.etiqueta })),
    },
    catalogo: tipoNegocio === 'servicios'
      ? servicios.map((s: any) => ({ nombre: s.nombre, precio: s.precio, activo: s.activo, descripcion: s.descripcion }))
      : productos.map((p: any) => ({ nombre: p.nombre, precio: p.precio, stock: p.stock, activo: p.activo, descripcion: p.descripcion })),
    empresa: empresaConfig ? {
      nombre: empresaConfig.nombre,
      nit: empresaConfig.nit,
      telefono: empresaConfig.telefono,
      ciudad: empresaConfig.ciudad,
    } : null,
    publicaciones: publicaciones.map((p: any) => ({ titulo: p.titulo, estado: p.estado, fecha: new Date(p.createdAt).toLocaleDateString('es-CO') })),
    erroresRecientes: botLogs.filter((l: any) => l.estado === 'error').slice(0, 5).map((l: any) => ({ evento: l.evento, error: l.error, fecha: new Date(l.createdAt).toLocaleDateString('es-CO') })),
  }
}
