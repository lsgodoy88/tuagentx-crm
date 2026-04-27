'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const MESES: Record<string, string> = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic'
}

function fmtMes(m: string) {
  const [y, mo] = m.split('-')
  return `${MESES[mo]} ${y}`
}

export default function ReportesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reportes').then(r => r.json()).then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  if (user?.role !== 'admin') return null

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-zinc-400 mt-1">Ventas confirmadas por empresa mes a mes</p>
      </div>
      {loading ? (
        <div className="text-zinc-400">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="text-zinc-400">No hay datos</div>
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((emp: any) => (
            <div key={emp.empresa} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {emp.empresa?.[0]?.toUpperCase()}
                </div>
                <h2 className="text-white font-semibold">{emp.empresa}</h2>
                <span className="ml-auto text-zinc-500 text-sm">{emp.meses.length} meses con ventas</span>
              </div>
              {emp.meses.length === 0 ? (
                <div className="px-6 py-4 text-zinc-500 text-sm">Sin ventas confirmadas</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-6 py-3 text-left text-zinc-400 text-xs font-medium">Mes</th>
                        <th className="px-6 py-3 text-right text-zinc-400 text-xs font-medium">Ventas</th>
                        <th className="px-6 py-3 text-right text-zinc-400 text-xs font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.meses.map((m: any) => (
                        <tr key={m.mes} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-3 text-white text-sm">{fmtMes(m.mes)}</td>
                          <td className="px-6 py-3 text-right text-zinc-300 text-sm">{m.cantidad}</td>
                          <td className="px-6 py-3 text-right text-emerald-400 text-sm font-medium">${m.total.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-800/30">
                        <td className="px-6 py-3 text-zinc-400 text-xs font-medium">Total</td>
                        <td className="px-6 py-3 text-right text-white text-sm font-bold">{emp.meses.reduce((a: number, m: any) => a + m.cantidad, 0)}</td>
                        <td className="px-6 py-3 text-right text-emerald-400 text-sm font-bold">${emp.meses.reduce((a: number, m: any) => a + m.total, 0).toLocaleString('es-CO')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
