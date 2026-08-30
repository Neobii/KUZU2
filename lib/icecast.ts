export type IcecastSource = {
  listeners?: number
  title?: string
  artist?: string
}

export type IcecastStats = {
  icestats?: {
    source?: IcecastSource | IcecastSource[]
  }
}

/** Pick the mount that carries now-playing metadata (prefer one with title/artist). */
export function getIcecastSource(data: IcecastStats): IcecastSource | null {
  const src = data.icestats?.source
  if (!src) return null
  if (Array.isArray(src)) {
    return src.find((mount) => mount.title?.trim() || mount.artist?.trim()) ?? src[0] ?? null
  }
  return src
}

/** Format Icecast source metadata like Meteor `getCurrentTrack`. */
export function formatIcecastNowPlaying(source: IcecastSource | null): string | null {
  if (!source) return null
  const artist = source.artist?.trim()
  const title = source.title?.trim()

  if (artist && title) {
    if (title.toLowerCase().startsWith(artist.toLowerCase())) {
      return title
    }
    return `${artist} - ${title}`
  }
  if (title) return title
  if (artist) return artist
  return null
}

function splitArtistTitle(combined: string): { artist: string; songTitle: string } {
  const idx = combined.indexOf(' - ')
  if (idx > 0) {
    return {
      artist: combined.slice(0, idx).trim(),
      songTitle: combined.slice(idx + 3).trim() || combined,
    }
  }
  return { artist: '', songTitle: combined }
}

/** Parse Icecast mount metadata into artist + song title for tracklist rows. */
export function parseIcecastTrackParts(
  source: IcecastSource | null
): { artist: string; songTitle: string } | null {
  if (!source) return null
  const artistField = source.artist?.trim()
  const titleField = source.title?.trim()

  if (artistField && titleField) {
    if (titleField.toLowerCase().startsWith(artistField.toLowerCase())) {
      return splitArtistTitle(titleField)
    }
    return { artist: artistField, songTitle: titleField }
  }
  if (titleField) return splitArtistTitle(titleField)
  if (artistField) return { artist: artistField, songTitle: artistField }
  return null
}

export function icecastTrackDisplayKey(parts: { artist: string; songTitle: string }): string {
  if (parts.artist && parts.songTitle) {
    return `${parts.artist} - ${parts.songTitle}`
  }
  return parts.songTitle || parts.artist
}

/** Read listener count from Icecast status-json (single mount or sum of mounts). */
export function parseIcecastListeners(data: IcecastStats): number | null {
  const src = data.icestats?.source
  if (!src) return null

  if (Array.isArray(src)) {
    let total = 0
    let found = false
    for (const mount of src) {
      if (typeof mount.listeners === 'number') {
        total += mount.listeners
        found = true
      }
    }
    return found ? total : null
  }

  return typeof src.listeners === 'number' ? src.listeners : null
}

export function isIcecastAvailable(data: IcecastStats): boolean {
  return !!data.icestats?.source
}

export function getIcecastStatusUrl(): string {
  return process.env.ICECAST_STATUS_URL ?? 'http://stream.kuzu.fm:8000/status-json.xsl'
}

const ICECAST_FETCH_TIMEOUT_MS = 8000

/** Poll interval for Icecast now-playing → admin/licensing track rows (default 1s). */
export function getIcecastTrackPollIntervalMs(): number {
  const parsed = parseInt(process.env.ICECAST_TRACK_POLL_MS ?? '1000', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
}

export function getListenerPollIntervalMs(): number {
  const parsed = parseInt(process.env.LISTENER_POLL_MS ?? '300000', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300000
}

export async function fetchIcecastStats(): Promise<IcecastStats | null> {
  try {
    const res = await fetch(getIcecastStatusUrl(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(ICECAST_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    return (await res.json()) as IcecastStats
  } catch {
    return null
  }
}

/** Live now-playing string from Icecast status-json (Radio Logik / stream metadata). */
export async function fetchIcecastNowPlaying(): Promise<string | null> {
  const data = await fetchIcecastStats()
  if (!data) return null
  return formatIcecastNowPlaying(getIcecastSource(data))
}
