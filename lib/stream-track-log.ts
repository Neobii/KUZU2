import { prisma } from '@/lib/prisma'
import { getIcecastTrackPollIntervalMs } from '@/lib/icecast'

/** Minimum near-duplicate window for metadata flicker / dual poll. */
export const STREAM_TRACK_DEDUP_MS = 4 * 60 * 1000

/** Dedup window for stream/licensing logs — always longer than the listener poll interval. */
export function getStreamTrackDedupMs(): number {
  return Math.max(STREAM_TRACK_DEDUP_MS, getIcecastTrackPollIntervalMs() + 60_000)
}

function splitCombinedArtistTitle(combined: string): { artist: string; songTitle: string } {
  const idx = combined.indexOf(' - ')
  if (idx > 0) {
    return {
      artist: combined.slice(0, idx).trim(),
      songTitle: combined.slice(idx + 3).trim() || combined,
    }
  }
  return { artist: '', songTitle: combined }
}

/** Normalize artist/title the same way Icecast metadata is parsed before logging. */
export function normalizeStreamTrackParts(
  artist: string | null,
  songTitle: string
): { artist: string; songTitle: string } {
  let a = artist?.trim() ?? ''
  let t = songTitle.trim()
  if (!a && t.includes(' - ')) {
    const parts = splitCombinedArtistTitle(t)
    a = parts.artist
    t = parts.songTitle
  }
  const aLower = a.toLowerCase()
  const tLower = t.toLowerCase()
  if (aLower && tLower.startsWith(`${aLower} - `)) {
    t = t.slice(a.length + 3).trim() || t
  }
  return {
    artist: aLower,
    songTitle: t.toLowerCase(),
  }
}

export function normalizeStreamTrackKey(artist: string | null, songTitle: string): string {
  const { artist: a, songTitle: t } = normalizeStreamTrackParts(artist, songTitle)
  if (a && t) return `${a} - ${t}`
  return t || a
}

/** True when two logged rows represent the same on-air song (metadata may omit artist). */
export function streamTracksMatch(
  artistA: string | null,
  songTitleA: string,
  artistB: string | null,
  songTitleB: string
): boolean {
  const a = normalizeStreamTrackParts(artistA, songTitleA)
  const b = normalizeStreamTrackParts(artistB, songTitleB)
  if (!a.songTitle || !b.songTitle) {
    return normalizeStreamTrackKey(artistA, songTitleA) === normalizeStreamTrackKey(artistB, songTitleB)
  }
  if (a.songTitle !== b.songTitle) return false
  if (a.artist && b.artist) return a.artist === b.artist
  return true
}

export async function hasRecentStreamTrackPlay(
  artist: string | null,
  songTitle: string,
  windowMs = getStreamTrackDedupMs(),
  db: Pick<typeof prisma, 'tracklist'> = prisma
): Promise<boolean> {
  const titleTrim = songTitle.trim()
  if (!titleTrim) return false

  const since = new Date(Date.now() - windowMs)

  const recent = await db.tracklist.findMany({
    where: {
      playDate: { gte: since },
      trackType: 'song',
    },
    select: { artist: true, songTitle: true },
    orderBy: { playDate: 'desc' },
    take: 50,
  })

  return recent.some((row) => streamTracksMatch(artist, titleTrim, row.artist, row.songTitle))
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

  return prisma.$transaction(async (tx) => {
    if (await hasRecentStreamTrackPlay(input.artist, songTitle, getStreamTrackDedupMs(), tx)) {
      return { stored: false, track: displayKey }
    }

    await tx.tracklist.create({
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
  })
}

type KeptPlay = {
  playDate: Date
  artist: string | null
  songTitle: string
}

/** Remove near-duplicate licensing rows (same song within `windowMs`), keeping earliest play. */
export async function cleanupNearDuplicateStreamTracks(options?: {
  windowMs?: number
  since?: Date
  until?: Date
}): Promise<{ deleted: number; scanned: number }> {
  const windowMs = options?.windowMs ?? getStreamTrackDedupMs()
  const since =
    options?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const tracks = await prisma.tracklist.findMany({
    where: {
      trackType: 'song',
      playDate: {
        not: null,
        gte: since,
        ...(options?.until ? { lt: options.until } : {}),
      },
    },
    orderBy: { playDate: 'asc' },
    select: { id: true, artist: true, songTitle: true, playDate: true },
  })

  const lastKept: KeptPlay[] = []
  const toDelete: string[] = []

  for (const track of tracks) {
    if (!track.playDate) continue
    const playTime = track.playDate.getTime()

    while (lastKept.length && playTime - lastKept[0].playDate.getTime() >= windowMs) {
      lastKept.shift()
    }

    const isDuplicate = lastKept.some((kept) =>
      streamTracksMatch(track.artist, track.songTitle, kept.artist, kept.songTitle)
    )
    if (isDuplicate) {
      toDelete.push(track.id)
    } else {
      lastKept.push({
        playDate: track.playDate,
        artist: track.artist,
        songTitle: track.songTitle,
      })
    }
  }

  if (toDelete.length > 0) {
    await prisma.tracklist.deleteMany({ where: { id: { in: toDelete } } })
  }

  return { deleted: toDelete.length, scanned: tracks.length }
}
