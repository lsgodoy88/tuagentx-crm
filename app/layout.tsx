
import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'TuAgentX — Panel',
  description: 'Panel de administración de bots WhatsApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
