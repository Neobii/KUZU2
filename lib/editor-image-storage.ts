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

/** Vercel Blob: OIDC (`BLOB_STORE_ID`) or legacy `BLOB_READ_WRITE_TOKEN`. */
export function isBlobStorageConfigured(): boolean {
  return !!(
    process.env.BLOB_STORE_ID?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim()
  )
}

/**
 * Store a processed editor image.
 * - Production (Vercel): Vercel Blob when store is connected (`BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`)
 * - Local dev: public/uploads/editor (served as /uploads/editor/…)
 */
export async function storeEditorImage(
  buffer: Buffer,
  filename: string,
  extension: string
): Promise<string> {
  const contentType = contentTypeForExtension(extension)

  if (isBlobStorageConfigured()) {
    // SDK auth: OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN on Vercel) or BLOB_READ_WRITE_TOKEN fallback
    const blob = await put(`editor/${filename}`, buffer, {
      access: 'public',
      contentType,
    })
    return blob.url
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', 'editor')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/editor/${filename}`
}
