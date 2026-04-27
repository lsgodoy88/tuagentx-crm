import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import { join } from 'path'

const execFileAsync = promisify(execFile)

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_CHARS = 50_000

const TIPOS_PERMITIDOS = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const archivo = formData.get('archivo') as File | null
  if (!archivo) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  if (archivo.size > MAX_BYTES)
    return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })

  const tipo = archivo.type
  const nombre = archivo.name.toLowerCase()
  const esPdf  = nombre.endsWith('.pdf')
  const esDocx = nombre.endsWith('.docx')
  const esTxt  = nombre.endsWith('.txt')

  if (!TIPOS_PERMITIDOS.has(tipo) && !esPdf && !esDocx && !esTxt)
    return NextResponse.json({ error: 'Formato no soportado. Usa PDF, DOCX o TXT.' }, { status: 400 })

  const arrayBuffer = await archivo.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    let texto = ''

    if (esPdf) {
      const tmpPath = join('/tmp', `${randomUUID()}.pdf`)
      try {
        await writeFile(tmpPath, buffer)
        const { stdout } = await execFileAsync('pdftotext', [tmpPath, '-'])
        texto = stdout
      } catch {
        return NextResponse.json({ error: 'No se pudo leer el PDF. Puede estar corrupto o protegido con contraseña.' }, { status: 422 })
      } finally {
        await unlink(tmpPath).catch(() => {})
      }
    } else if (esDocx) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      texto = result.value
    } else if (esTxt) {
      texto = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Usa PDF, DOCX o TXT.' }, { status: 400 })
    }

    texto = texto.trim()

    if (texto.length > MAX_CHARS) {
      texto = texto.substring(0, MAX_CHARS)
      return NextResponse.json({ texto, aviso: `El texto fue truncado a ${MAX_CHARS.toLocaleString()} caracteres.` })
    }

    return NextResponse.json({ texto })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error procesando el archivo' }, { status: 500 })
  }
}
