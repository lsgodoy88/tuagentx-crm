import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env')

function readEnv(): Record<string, string> {
  const content = fs.readFileSync(ENV_PATH, 'utf-8')
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) result[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '')
  }
  return result
}

function writeEnv(vars: Record<string, string>) {
  const content = fs.readFileSync(ENV_PATH, 'utf-8')
  let updated = content
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(updated)) {
      updated = updated.replace(regex, `${key}="${value}"`)
    } else {
      updated += `\n${key}="${value}"`
    }
  }
  fs.writeFileSync(ENV_PATH, updated)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const env = readEnv()
  const mask = (v: string) => v ? v.slice(0, 8) + '••••••••' + v.slice(-4) : ''
  return NextResponse.json({
    openai: mask(env.OPENAI_API_KEY || ''),
    anthropic: mask(env.ANTHROPIC_API_KEY || ''),
    evolution: mask(env.EVOLUTION_API_KEY || ''),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { openai, anthropic, evolution } = await req.json()
  const updates: Record<string, string> = {}
  if (openai && !openai.includes('••')) updates.OPENAI_API_KEY = openai
  if (anthropic && !anthropic.includes('••')) updates.ANTHROPIC_API_KEY = anthropic
  if (evolution && !evolution.includes('••')) updates.EVOLUTION_API_KEY = evolution
  if (Object.keys(updates).length > 0) writeEnv(updates)
  return NextResponse.json({ ok: true })
}
