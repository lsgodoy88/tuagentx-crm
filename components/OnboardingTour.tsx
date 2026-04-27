'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function OnboardingTour() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user = session?.user as any
  const [mounted, setMounted] = useState(false)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user?.role === 'empresa') {
      const visto = localStorage.getItem(`tour-${user.email}`)
      if (!visto) setMostrar(true)
    }
  }, [user])

  async function iniciarTour() {
    await import('driver.js/dist/driver.css' as any)
    const { driver } = await import('driver.js')
    
    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Atrás',
      doneBtnText: '¡Listo! 🚀',
      onDestroyed: () => {
        localStorage.setItem(`tour-${user.email}`, '1')
        setMostrar(false)
      },
      steps: [
        {
          element: 'nav',
          popover: {
            title: '👋 Bienvenido a TuAgentX',
            description: 'Este es tu panel de control. Desde aquí manejas todo tu negocio automatizado con IA.',
            side: 'right',
          }
        },
        {
          element: '[href="/dashboard"]',
          popover: {
            title: '⚡ Inicio',
            description: 'Aquí verás un resumen de tus ventas, estadísticas y el estado de tu cuenta.',
            side: 'right',
          }
        },
        {
          element: '[href="/dashboard/bots"]',
          popover: {
            title: '🤖 Mis Agentes',
            description: 'Aquí conectas tu WhatsApp y configuras la personalidad de tu agente de IA.',
            side: 'right',
          }
        },
        {
          element: '[href="/dashboard/ventas"]',
          popover: {
            title: '🛍️ Ventas',
            description: 'Cada vez que tu agente cierre una venta aparecerá aquí automáticamente.',
            side: 'right',
          }
        },
        {
          element: '[href="/dashboard/conversaciones"]',
          popover: {
            title: '💬 Conversaciones',
            description: 'Revisa todas las conversaciones que tu agente ha tenido con tus clientes.',
            side: 'right',
          }
        },
        {
          element: '[href="/dashboard/configuracion"]',
          popover: {
            title: '⚙️ Configuración',
            description: 'Cambia tu contraseña y ajusta las preferencias de tu cuenta.',
            side: 'right',
          }
        },
        {
          popover: {
            title: '🚀 ¡Ya estás listo!',
            description: 'Empieza conectando tu WhatsApp en "Mis Agentes". Tu agente de IA estará atendiendo clientes en minutos.',
          }
        },
      ]
    })
    driverObj.drive()
  }

  useEffect(() => {
    if (mounted && mostrar && pathname === '/dashboard') {
      setTimeout(iniciarTour, 1000)
    }
  }, [mounted, mostrar, pathname])

  if (!mostrar) return null

  return (
    <button onClick={iniciarTour}
      className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2">
      🗺️ Ver tour
    </button>
  )
}
