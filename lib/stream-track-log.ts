import { prisma } from '@/lib/prisma'
import { formatStationCalendarDay } from '@/lib/datetime-local'
import { getIcecastTrackPollIntervalMs } from '@/lib/icecast'
import { Prisma } from '@prisma/client'

/** Minimum near-duplicate window for metadata flicker / dual poll. */
export const STREAM_TRACK_DEDUP_MS = 4 * 60 * 1000

/** Admin cleanup window (legacy; cleanup now dedupes per station calendar day). */
export const CLEANUP_NEAR_DUPLICATE_MS = 2 * 60 * 60 * 1000

/** While Icecast still reports the same song, do not log again (typical song length + buffer). */
export const ICECAST_SAME_TRACK_ON_AIR_MS = 20 * 60 * 1000

/** Dedup window for stream/licensing logs — always longer than the listener poll interval. */
export function getStreamTrackDedupMs(): number {
  return Math.max(STREAM_TRACK_DEDUP_MS, getIcecastTrackPollIntervalMs() + 60_000)
}

function normalizeMatchText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
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
  a = normalizeMatchText(a)
  t = normalizeMatchText(t)
  if (a && t.startsWith(`${a} - `)) {
    t = normalizeMatchText(t.slice(a.length + 3)) || t
  }
  return {
    artist: a,
    songTitle: t,
  }
}

export function normalizeStreamTrackKey(artist: string | null, songTitle: string): string {
  const { artist: a, songTitle: t } = normalizeStreamTrackParts(artist, songTitle)
  if (a && t) return `${a} - ${t}`
  return t || a
}

function looseSongTitleMatch(a: string, b: string): boolean {
  if (a === b) return true
  const loose = (s: string) =>
    s
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
  return loose(a) === loose(b)
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
  if (a.songTitle !== b.songTitle && !looseSongTitleMatch(a.songTitle, b.songTitle)) return false
  if (a.artist && b.artist) return a.artist === b.artist
  return true
}

/** Skip Icecast polls while the latest play is still the same song on the same station day. */
export async function hasSameSongStillOnAir(
  artist: string | null,
  songTitle: string,
  _windowMs = ICECAST_SAME_TRACK_ON_AIR_MS,
  db: Pick<typeof prisma, 'tracklist'> = prisma
): Promise<boolean> {
  return shouldSkipDuplicateStreamInsert(artist, songTitle, db)
}

/** True when this song should not be logged again (recent row or same as latest play today). */
export async function shouldSkipDuplicateStreamInsert(
  artist: string | null,
  songTitle: string,
  db: Pick<typeof prisma, 'tracklist'> = prisma
): Promise<boolean> {
  const titleTrim = songTitle.trim()
  if (!titleTrim) return true

  if (await hasRecentStreamTrackPlay(artist, titleTrim, getStreamTrackDedupMs(), db)) {
    return true
  }

  const last = await db.tracklist.findFirst({
    where: { trackType: 'song', playDate: { not: null } },
    orderBy: { playDate: 'desc' },
    select: { artist: true, songTitle: true, playDate: true },
  })
  if (!last?.playDate) return false
  if (!tracksDuplicateForCleanup(artist, titleTrim, last.artist, last.songTitle)) return false

  return formatStationCalendarDay(last.playDate) === formatStationCalendarDay(new Date())
}

/** Aggressive duplicate test for admin cleanup (metadata variants + exact keys). */
export function tracksDuplicateForCleanup(
  artistA: string | null,
  songTitleA: string,
  artistB: string | null,
  songTitleB: string
): boolean {
  if (streamTracksMatch(artistA, songTitleA, artistB, songTitleB)) return true
  const keyA = normalizeStreamTrackKey(artistA, songTitleA)
  const keyB = normalizeStreamTrackKey(artistB, songTitleB)
  if (keyA && keyB && keyA === keyB) return true

  const partsA = normalizeStreamTrackParts(artistA, songTitleA)
  const partsB = normalizeStreamTrackParts(artistB, songTitleB)
  if (!partsA.songTitle || !partsB.songTitle) return false
  if (!looseSongTitleMatch(partsA.songTitle, partsB.songTitle)) return false
  if (!partsA.artist || !partsB.artist) return true
  return partsA.artist === partsB.artist
}

type CleanupTrack = {
  id: string
  showId: string | null
  playDate: Date
  artist: string | null
  songTitle: string
}

function pickClusterKeeper(cluster: CleanupTrack[]): CleanupTrack {
  return cluster.reduce<CleanupTrack | null>((best, row) => {
    if (!best) return row
    if (row.showId && !best.showId) return row
    if (best.showId && !row.showId) return best
    return row.playDate.getTime() < best.playDate.getTime() ? row : best
  }, null)!
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

  return prisma.$transaction(
    async (tx) => {
      if (await shouldSkipDuplicateStreamInsert(input.artist, songTitle, tx)) {
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
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

/** Remove duplicate plays in range — same song on the same station day keeps earliest row. */
export async function cleanupNearDuplicateStreamTracks(options: {
  since: Date
  until: Date
}): Promise<{ deleted: number; scanned: number; duplicateGroups: number }> {
  const { since, until } = options

  const tracks = await prisma.tracklist.findMany({
    where: {
      playDate: { not: null, gte: since, lt: until },
    },
    orderBy: { playDate: 'asc' },
    select: { id: true, showId: true, artist: true, songTitle: true, playDate: true },
  })

  const byStationDay = new Map<string, CleanupTrack[]>()
  for (const track of tracks) {
    if (!track.playDate) continue
    const stationDay = formatStationCalendarDay(track.playDate)
    const row: CleanupTrack = {
      id: track.id,
      showId: track.showId,
      playDate: track.playDate,
      artist: track.artist,
      songTitle: track.songTitle,
    }
    const bucket = byStationDay.get(stationDay) ?? []
    bucket.push(row)
    byStationDay.set(stationDay, bucket)
  }

  const toDelete = new Set<string>()
  let duplicateGroups = 0

  for (const dayTracks of byStationDay.values()) {
    dayTracks.sort((a, b) => a.playDate.getTime() - b.playDate.getTime())
    const clusters: CleanupTrack[][] = []

    for (const track of dayTracks) {
      let placed = false
      for (const cluster of clusters) {
        if (tracksDuplicateForCleanup(track.artist, track.songTitle, cluster[0].artist, cluster[0].songTitle)) {
          cluster.push(track)
          placed = true
          break
        }
      }
      if (!placed) clusters.push([track])
    }

    for (const cluster of clusters) {
      if (cluster.length <= 1) continue
      duplicateGroups++
      const keeper = pickClusterKeeper(cluster)
      for (const row of cluster) {
        if (row.id !== keeper.id) toDelete.add(row.id)
      }
    }
  }

  const deleteIds = [...toDelete]
  if (deleteIds.length > 0) {
    const chunkSize = 500
    for (let i = 0; i < deleteIds.length; i += chunkSize) {
      await prisma.tracklist.deleteMany({
        where: { id: { in: deleteIds.slice(i, i + chunkSize) } },
      })
    }
  }

  return { deleted: deleteIds.length, scanned: tracks.length, duplicateGroups }
}
