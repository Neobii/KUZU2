import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { compressUploadImage } from '@/lib/compress-upload-image'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!file || typeof file === 'string' || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 })
  }

  const type = file.type
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 })
  }

  const raw = Buffer.from(await file.arrayBuffer())

  let processed: Buffer
  let ext: string
  try {
    const out = await compressUploadImage(raw)
    processed = out.buffer
    ext = out.extension
  } catch (e) {
    console.error('[uploads/image] compress failed', e)
    return NextResponse.json(
      { error: 'Could not process this image. Try a different file or format.' },
      { status: 422 }
    )
  }

  const name = `${randomUUID()}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', 'editor')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), processed)

  const url = `/uploads/editor/${name}`
  return NextResponse.json({ url })
}
