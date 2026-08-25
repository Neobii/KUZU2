import { prisma } from '@/lib/prisma'

/** Ignore repeat stream logs for the same song within this window (metadata flicker / dual poll). */
export const STREAM_TRACK_DEDUP_MS = 4 * 60 * 1000

export function normalizeStreamTrackKey(artist: string | null, songTitle: string): string {
  const a = artist?.trim().toLowerCase() ?? ''
  const t = songTitle.trim().toLowerCase()
  if (a && t) return `${a} - ${t}`
  return t || a
}

export async function hasRecentStreamTrackPlay(
  artist: string | null,
  songTitle: string,
  windowMs = STREAM_TRACK_DEDUP_MS
): Promise<boolean> {
  const titleTrim = songTitle.trim()
  if (!titleTrim) return false

  const since = new Date(Date.now() - windowMs)
  const targetKey = normalizeStreamTrackKey(artist, titleTrim)

  // Only compare against stream/licensing rows (showId null). Show playlist
  // plays of the same song must not suppress the durable licensing log — e.g.
  // after a live show ends, Icecast often still shows the last track, and
  // deleteShow removes show-attached rows.
  const recent = await prisma.tracklist.findMany({
    where: {
      showId: null,
      playDate: { gte: since },
      trackType: 'song',
    },
    select: { artist: true, songTitle: true },
    orderBy: { playDate: 'desc' },
    take: 30,
  })

  return recent.some(
    (row) => normalizeStreamTrackKey(row.artist, row.songTitle) === targetKey
  )
}

export type StreamTrackLogInput = {
  artist: string | null
  songTitle: string
  album?: string | null
  label?: string | null
  trackLength?: string | null
  artistId?: string | null
}

/** Persist a licensing/stream track row unless the same song was logged recently. */
export async function createStreamTrackLog(
  input: StreamTrackLogInput
): Promise<{ stored: boolean; track: string | null }> {
  const songTitle = input.songTitle.trim()
  if (!songTitle) return { stored: false, track: null }

  const displayKey = normalizeStreamTrackKey(input.artist, songTitle)
  if (await hasRecentStreamTrackPlay(input.artist, songTitle)) {
    return { stored: false, track: displayKey }
  }

  await prisma.tracklist.create({
    data: {
      artist: input.artist?.trim() || null,
      artistId: input.artistId ?? null,
      songTitle,
      album: input.album ?? null,
      label: input.label ?? null,
      trackLength: input.trackLength ?? null,
      trackType: 'song',
      playDate: new Date(),
    },
  })

  return { stored: true, track: displayKey }
}

/** Remove near-duplicate stream/licensing rows (same song within `windowMs`), keeping earliest play. */
export async function cleanupNearDuplicateStreamTracks(options?: {
  windowMs?: number
  since?: Date
}): Promise<{ deleted: number; scanned: number }> {
  const windowMs = options?.windowMs ?? STREAM_TRACK_DEDUP_MS
  const since =
    options?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const tracks = await prisma.tracklist.findMany({
    where: {
      showId: null,
      trackType: 'song',
      playDate: { not: null, gte: since },
    },
    orderBy: { playDate: 'asc' },
    select: { id: true, artist: true, songTitle: true, playDate: true },
  })

  const lastKeptByKey = new Map<string, Date>()
  const toDelete: string[] = []

  for (const track of tracks) {
    if (!track.playDate) continue
    const key = normalizeStreamTrackKey(track.artist, track.songTitle)
    const lastKept = lastKeptByKey.get(key)
    if (lastKept && track.playDate.getTime() - lastKept.getTime() < windowMs) {
      toDelete.push(track.id)
    } else {
      lastKeptByKey.set(key, track.playDate)
    }
  }

  if (toDelete.length > 0) {
    await prisma.tracklist.deleteMany({ where: { id: { in: toDelete } } })
  }

  return { deleted: toDelete.length, scanned: tracks.length }
}
