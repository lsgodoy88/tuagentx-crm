import { prisma } from './prisma'

export async function audit(
  accion: string,
  usuario?: string,
  detalle?: string,
  ip?: string
) {
  try {
    await prisma.auditLog.create({
      data: { accion, usuario, detalle, ip }
    })
  } catch(e) {
    console.log('Audit error:', e)
  }
}
