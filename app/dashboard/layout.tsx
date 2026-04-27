'use client'
import AsistentePanel from '@/components/AsistentePanel'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: '⚡' },
  { href: '/dashboard/empresas', label: 'Empresas', icon: '🏢', adminOnly: true },
  { href: '/dashboard/demo', label: 'Demo & Leads', icon: '🎯', adminOnly: true },
  { href: '/dashboard/chats', label: 'Chats', icon: '💬', adminOnly: true },
  { href: '/dashboard/agentes', label: 'Mis Agentes', icon: '🤖', empresaOnly: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/ventas', label: 'Ventas', icon: '🛍️', soloModuloVentas: true },
  { href: '/dashboard/cartera', label: 'Cartera', icon: '💰', empresaOnly: true, soloModuloCartera: true },
  { href: '/dashboard/inventario', label: 'Productos', icon: '📦', empresaOnly: true, soloProductos: true, soloModuloVentas: true },
  { href: '/dashboard/servicios', label: 'Servicios', icon: '🛠️', empresaOnly: true, soloServicios: true, soloModuloVentas: true },
  { href: '/dashboard/citas', label: 'Citas', icon: '📅', empresaOnly: true, soloModuloCitas: true },
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: '💰', empresaOnly: true },
  { href: '/dashboard/crecer', label: 'Crecer', icon: '🚀', empresaOnly: true },
  { href: '/dashboard/publicar', label: 'Publicar', icon: '📣', empresaOnly: true },
  { href: '/dashboard/reportes', label: 'Reportes', icon: '📊', adminOnly: true },
  { href: '/dashboard/precios', label: 'Precios', icon: '💰', adminOnly: true },
  { href: '/dashboard/diagnostico', label: 'Diagnóstico', icon: '🔬', adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [bannerCerrado, setBannerCerrado] = useState(false)
  const [renovando, setRenovando] = useState(false)
  const [ventasNuevas, setVentasNuevas] = useState(0)
  const [stockBajo, setStockBajo] = useState(0)
  const [sinTelefono, setSinTelefono] = useState(false)
  const [tipoNegocio, setTipoNegocio] = useState<string>('productos')
  const [asistenteAbierto, setAsistenteAbierto] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const user = session?.user as any
  const modulos: string[] = user?.modulos || []
  const iconoActivo = navItems.find(item => pathname === item.href)?.icon || '⚡'

  function filtrarNav(item: any) {
    if (item.adminOnly && user?.role !== 'admin') return false
    if (item.empresaOnly && user?.role !== 'empresa') return false
    if (item.soloProductos && tipoNegocio !== 'productos') return false
    if (item.soloServicios && tipoNegocio !== 'servicios') return false
    if (item.soloModuloVentas && !modulos.includes('ventas')) return false
    if (item.soloModuloCartera && !modulos.includes('cartera')) return false
    if (item.soloModuloCitas && !modulos.includes('citas') && !(modulos.includes('ventas') && tipoNegocio === 'servicios')) return false
    return true
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!user || user.role === 'admin') return
    fetch('/api/mi-empresa/estado')
      .then(r => r.json())
      .then(d => {
        if (d.activa === false) setBloqueado(true)
        if (typeof d.diasRestantes === 'number') setDiasRestantes(d.diasRestantes)
      })
      .catch(() => {})
  }, [user])



  useEffect(() => {
    if (!user) return
    const fetchVentas = () => fetch('/api/ventas/nuevas').then(r => r.json()).then(d => setVentasNuevas(d.count || 0)).catch(() => {})
    const fetchStock = () => fetch('/api/inventario/alertas').then(r => r.json()).then(d => setStockBajo(d.count || 0)).catch(() => {})
    fetchVentas()
    fetchStock()
    const t = setInterval(fetchVentas, 120000)
    window.addEventListener('refreshVentas', fetchVentas)
    return () => { clearInterval(t); window.removeEventListener('refreshVentas', fetchVentas) }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetch('/api/empresa-config').then(r => r.json()).then(d => {
      setSinTelefono(!d.telefono)
    }).catch(() => {})
    fetch('/api/configuracion/tipo').then(r => r.json()).then(d => {
      if (d.tipoNegocio) setTipoNegocio(d.tipoNegocio)
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    async function suscribirPush() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const permiso = await Notification.requestPermission()
        if (permiso !== 'granted') return
        const existing = await reg.pushManager.getSubscription()
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BGM43jCYmNx71QbrprleQr4ob0WhwaZj65jrB4H7QzjDiOVpvxsOeciZSEEI3um1GN4LnXrhz_z8TI4wpt41-P8'
        })
        await fetch('/api/push/suscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) } })
        })
      } catch(e) { console.log('Push no disponible:', e) }
    }
    suscribirPush()
  }, [user])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Overlay menu movil */}
      {menuMovil && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMenuMovil(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-[2001]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <span className="text-white font-bold">TuAgentX</span>
              </div>
              <button onClick={() => setMenuMovil(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.filter(filtrarNav).map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuMovil(false)}
                  className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors " + (pathname === item.href ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-zinc-800 space-y-1">
              <button onClick={() => { setMenuMovil(false); setAsistenteAbierto(true) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-zinc-400 hover:text-white hover:bg-zinc-800">
                <span className="relative">🤖<span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /></span>
                TuAgentX
              </button>
              <div className="relative">
                <button onClick={() => setMenuUsuario(m => !m)}
                  className="flex items-center gap-3 px-3 py-2 w-full hover:bg-zinc-800 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white text-sm font-medium truncate">{user?.name}</div>
                    <div className="text-zinc-500 text-xs">{user?.role === 'admin' ? 'Administrador' : user?.instance}</div>
                  </div>
                  <span className="text-zinc-500 text-xs">{menuUsuario ? '▲' : '▼'}</span>
                </button>
                {menuUsuario && (
                  <div className="mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                    <Link href="/dashboard/configuracion" onClick={() => { setMenuMovil(false); setMenuUsuario(false) }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
                      <span>⚙️</span> Configuración
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-700 transition-colors w-full">
                      <span>🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boton flotante movil */}
      <div className={`fixed bottom-6 left-4 z-[990] md:hidden ${menuMovil ? "hidden" : ""}`}>
        <button onClick={() => setMenuMovil(true)}
          className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm border border-emerald-500/40 rounded-2xl px-3 py-2.5 shadow-2xl">
          <span className="text-2xl">{iconoActivo}</span>
        </button>
      </div>

      <aside className={`${collapsed ? 'w-16' : 'w-48'} bg-zinc-900 border-r border-zinc-800 flex-col transition-all duration-300 h-full overflow-y-auto hidden md:flex`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="text-white font-bold tracking-tight">TuAgentX</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="mx-auto mt-3 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter(filtrarNav).map(item => (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : ''}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${
                pathname === item.href
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}>
              <span className="text-base">{item.icon}</span>
              {!collapsed && item.label}
              {!collapsed && item.href === '/dashboard/ventas' && ventasNuevas > 0 && (
                <span className="ml-auto bg-emerald-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{ventasNuevas}</span>
              )}
              {!collapsed && item.href === '/dashboard/inventario' && stockBajo > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{stockBajo}</span>
              )}
              {collapsed && item.href === '/dashboard/inventario' && stockBajo > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {collapsed && item.href === '/dashboard/ventas' && ventasNuevas > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800 space-y-1">
          <button onClick={() => setAsistenteAbierto(true)} title={collapsed ? 'TuAgentX' : ''}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${collapsed ? 'justify-center' : ''} text-zinc-400 hover:text-white hover:bg-zinc-800`}>
            <span className="relative">🤖<span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /></span>
            {!collapsed && 'TuAgentX'}
          </button>
          {!collapsed ? (
            <div className="relative">
              <button onClick={() => setMenuUsuario(!menuUsuario)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
                <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-sm font-medium truncate">{user?.name}</div>
                  <div className="text-zinc-500 text-xs truncate">{user?.role === 'admin' ? 'Administrador' : user?.instance}</div>
                </div>
                <span className="text-zinc-500 text-xs">{menuUsuario ? '▲' : '▼'}</span>
              </button>
              {menuUsuario && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                  <Link href="/dashboard/configuracion" onClick={() => setMenuUsuario(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
                    <span>⚙️</span> Configuración
                    {sinTelefono && <span className="ml-auto bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">!</span>}
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-left">
                    <span>🚪</span> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signOut({ callbackUrl: '/login' })} title="Cerrar sesión"
              className="w-full flex justify-center text-zinc-500 hover:text-white py-2 rounded-xl hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 w-0 overflow-hidden">
        {bloqueado && (
          <div className="bg-red-900/80 border-b border-red-700 flex items-center justify-between px-4 h-10 flex-shrink-0 overflow-hidden">
            <span className="text-red-100 text-sm truncate">
              <span className="hidden sm:inline">🔴 Cuenta suspendida</span>
              <span className="sm:hidden">🔴 Cuenta suspendida</span>
            </span>
            <a href="https://wa.me/573164349389?text=Hola, necesito reactivar mi cuenta de TuAgentX"
              target="_blank" rel="noopener noreferrer"
              className="ml-4 flex-shrink-0 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
              💬 Contactar
            </a>
          </div>
        )}
        {!bloqueado && !bannerCerrado && diasRestantes !== null && diasRestantes >= 1 && diasRestantes <= 7 && (() => {
          const d = diasRestantes
          const cfg = d === 1
            ? { bg: 'bg-red-900/80 border-red-700',       txt: '🔴 Tu plan vence MAÑANA',            cta: 'Renovar ahora' }
            : d <= 3
            ? { bg: 'bg-orange-900/70 border-orange-700', txt: `⚠️ Tu plan vence en ${d} días`,      cta: 'Renovar ahora' }
            : { bg: 'bg-emerald-900/60 border-emerald-700', txt: `📅 Tu plan vence en ${d} días`,    cta: '¿Renovar?' }
          return (
            <div className={`${cfg.bg} border-b flex items-center justify-between px-4 h-10 flex-shrink-0 overflow-hidden`}>
              <span className="text-white text-sm truncate">{cfg.txt}</span>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <button
                  disabled={renovando}
                  onClick={async () => {
                    setRenovando(true)
                    const win = window.open('', '_blank')
                    try {
                      const r = await fetch('/api/solicitar-renovacion', { method: 'POST' })
                      const data = await r.json()
                      if (data.linkPago && win) {
                        win.location.href = data.linkPago
                      } else {
                        win?.close()
                        console.error('[renovar]', data)
                      }
                    } catch (e) {
                      win?.close()
                      console.error('[renovar] fetch error:', e)
                    }
                    setRenovando(false)
                  }}
                  className="bg-white/20 hover:bg-white/30 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
                  {renovando ? 'Cargando...' : `💳 ${cfg.cta}`}
                </button>
                <button onClick={() => setBannerCerrado(true)} className="text-white/60 hover:text-white text-sm leading-none">✕</button>
              </div>
            </div>
          )
        })()}
        <div className={`flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6 pb-32 md:pb-6${bloqueado ? ' pointer-events-none opacity-50' : ''}`}>
          <div className="max-w-screen-xl mx-auto w-full space-y-6">
            {children}
          </div>
        </div>
      </main>
    {asistenteAbierto && <AsistentePanel onClose={() => setAsistenteAbierto(false)} />}
    </div>
  )
}
