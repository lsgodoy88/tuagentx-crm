import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = session.user as any
  const { id } = await params

  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const panelUser = await prisma.panelUser.findUnique({ where: { email: user.email }, include: { empresaConfig: true } })
  const config = panelUser?.empresaConfig

  const fecha = new Date(venta.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const iva = config?.iva || 0
  const subtotal = venta.monto || 0
  const totalIva = subtotal * (iva / 100)
  const total = subtotal + totalIva

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #1A7A4A; padding-bottom: 20px; }
  .logo { max-height: 70px; max-width: 180px; object-fit: contain; }
  .empresa-info { text-align: right; }
  .empresa-nombre { font-size: 18px; font-weight: bold; color: #1A7A4A; }
  .proforma-titulo { text-align: center; font-size: 22px; font-weight: bold; color: #1A7A4A; margin: 20px 0 5px; letter-spacing: 2px; }
  .proforma-num { text-align: center; color: #666; font-size: 12px; margin-bottom: 25px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
  .box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; }
  .box-title { font-weight: bold; color: #1A7A4A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .box-row { margin: 3px 0; color: #444; }
  .box-row span { font-weight: bold; color: #222; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #1A7A4A; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .totales { margin-left: auto; width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; color: #444; }
  .total-final { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; font-size: 16px; color: #1A7A4A; border-top: 2px solid #1A7A4A; margin-top: 5px; }
  .condiciones { margin-top: 25px; padding: 15px; background: #f0f7f3; border-left: 4px solid #1A7A4A; border-radius: 4px; }
  .condiciones-title { font-weight: bold; color: #1A7A4A; margin-bottom: 5px; font-size: 12px; }
  .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 15px; }
</style>
</head>
<body>
  <div class="header">
    ${config?.logo ? `<img src="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${config.logo}" class="logo" />` : '<div style="width:180px"></div>'}
    <div class="empresa-info">
      <div class="empresa-nombre">${panelUser?.name || 'Mi Empresa'}</div>
      ${config?.nit ? `<div>NIT: ${config.nit}</div>` : ''}
      ${config?.direccion ? `<div>${config.direccion}</div>` : ''}
      ${config?.telefono ? `<div>Tel: ${config.telefono}</div>` : ''}
    </div>
  </div>

  <div class="proforma-titulo">PROFORMA</div>
  <div class="proforma-num">No. ${venta.ventaId || venta.id.slice(-6).toUpperCase()} &nbsp;|&nbsp; Fecha: ${fecha}</div>

  <div class="grid-2">
    <div class="box">
      <div class="box-title">Datos del cliente</div>
      <div class="box-row">Nombre: <span>${venta.cliente}</span></div>
      ${venta.cedula ? `<div class="box-row">Cédula: <span>${venta.cedula}</span></div>` : ''}
      ${venta.direccion ? `<div class="box-row">Dirección: <span>${venta.direccion}</span></div>` : ''}
      ${venta.ciudad ? `<div class="box-row">Ciudad: <span>${venta.ciudad}</span></div>` : ''}
      ${venta.observacion ? `<div class="box-row">Obs: <span>${venta.observacion}</span></div>` : ''}
    </div>
    <div class="box">
      <div class="box-title">Información del pedido</div>
      <div class="box-row">N° Pedido: <span>${venta.ventaId || '—'}</span></div>
      <div class="box-row">Estado: <span>${venta.estado}</span></div>
      <div class="box-row">WhatsApp: <span>+${venta.numero}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Precio Unit.</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${venta.producto || venta.resumen}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">$${subtotal.toLocaleString('es-CO')}</td>
        <td style="text-align:right">$${subtotal.toLocaleString('es-CO')}</td>
      </tr>
    </tbody>
  </table>

  <div class="totales">
    <div class="total-row"><span>Subtotal</span><span>$${subtotal.toLocaleString('es-CO')}</span></div>
    ${iva > 0 ? `<div class="total-row"><span>IVA (${iva}%)</span><span>$${totalIva.toLocaleString('es-CO')}</span></div>` : ''}
    <div class="total-final"><span>TOTAL</span><span>$${total.toLocaleString('es-CO')}</span></div>
  </div>

  ${config?.condiciones ? `
  <div class="condiciones">
    <div class="condiciones-title">Condiciones de pago / validez</div>
    <div>${config.condiciones}</div>
  </div>` : ''}

  <div class="footer">Este documento es una proforma y no constituye una factura oficial.</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  })
}
