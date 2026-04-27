import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    await execAsync('cd /srv/panel && node scripts/monitor.js', { timeout: 10000 })
    return NextResponse.json({ ok: true })
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
