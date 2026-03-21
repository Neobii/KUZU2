import sharp from 'sharp'

/** Longest side (px); keeps aspect ratio, never upscales. */
const MAX_EDGE = 2048
/** WebP quality (still images & single-frame uploads). */
const WEBP_QUALITY = 82
/** Animated GIF effort (higher = smaller, slower). */
const GIF_EFFORT = 10

/**
 * Resize, auto-rotate (EXIF), and compress editor uploads.
 * - Still images (JPEG, PNG, WebP, single-frame GIF) → WebP
 * - Animated GIF → resized + re-encoded GIF (preserves animation)
 */
export async function compressUploadImage(input: Buffer): Promise<{ buffer: Buffer; extension: string }> {
  const meta = await sharp(input).metadata()
  const isAnimated = (meta.pages ?? 0) > 1

  const pipeline = sharp(input, {
    ...(isAnimated ? { animated: true, limitInputPixels: 268_402_689 } : { limitInputPixels: 268_402_689 }),
    sequentialRead: true,
  })
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })

  if (isAnimated) {
    const buffer = await pipeline.gif({ effort: GIF_EFFORT }).toBuffer()
    return { buffer, extension: 'gif' }
  }

  const buffer = await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toBuffer()
  return { buffer, extension: 'webp' }
}
