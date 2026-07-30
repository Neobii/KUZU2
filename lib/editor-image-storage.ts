import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob'

function contentTypeForExtension(ext: string): string {
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

/**
 * Store a processed editor image.
 * - Production (Vercel): Vercel Blob when BLOB_READ_WRITE_TOKEN is set
 * - Local dev: public/uploads/editor (served as /uploads/editor/…)
 */
export async function storeEditorImage(
  buffer: Buffer,
  filename: string,
  extension: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  const contentType = contentTypeForExtension(extension)

  if (token) {
    const blob = await put(`editor/${filename}`, buffer, {
      access: 'public',
      contentType,
      token,
    })
    return blob.url
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'editor')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/editor/${filename}`
}
