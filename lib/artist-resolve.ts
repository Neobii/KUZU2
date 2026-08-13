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

/** Link existing tracklist rows (artist name set, no artistId) to Artist records. */
export async function syncArtistsFromTracklist(): Promise<{
  tracksLinked: number
  artistCount: number
}> {
  const tracks = await prisma.tracklist.findMany({
    where: {
      artistId: null,
      artist: { not: null },
      NOT: { artist: '' },
    },
    select: { id: true, artist: true },
    orderBy: { playDate: 'desc' },
  })

  const artistIds = new Set<string>()
  let tracksLinked = 0

  for (const track of tracks) {
    const fields = await streamTrackArtistFields(track.artist)
    if (!fields.artistId) continue

    await prisma.tracklist.update({
      where: { id: track.id },
      data: {
        artistId: fields.artistId,
        artist: fields.artist,
      },
    })
    artistIds.add(fields.artistId)
    tracksLinked++
  }

  return { tracksLinked, artistCount: artistIds.size }
}
