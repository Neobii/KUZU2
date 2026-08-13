import { prisma } from '@/lib/prisma'

/** Find an artist by name (case-insensitive) or create one for stream / track logging. */
export async function findOrCreateArtistByName(
  artistName: string | null | undefined
): Promise<{ id: string; artistName: string } | null> {
  const trimmed = artistName?.trim()
  if (!trimmed) return null

  const existing = await prisma.artist.findFirst({
    where: { artistName: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true, artistName: true },
  })
  if (existing) return existing

  try {
    return await prisma.artist.create({
      data: { artistName: trimmed },
      select: { id: true, artistName: true },
    })
  } catch {
    return prisma.artist.findFirst({
      where: { artistName: { equals: trimmed, mode: 'insensitive' } },
      select: { id: true, artistName: true },
    })
  }
}

/** Artist string + id for stream-logged tracklist rows. */
export async function streamTrackArtistFields(artistName: string | null | undefined): Promise<{
  artist: string | null
  artistId: string | null
}> {
  const artist = await findOrCreateArtistByName(artistName)
  const fallback = artistName?.trim() || null
  return {
    artist: (artist?.artistName ?? fallback) || null,
    artistId: artist?.id ?? null,
  }
}
