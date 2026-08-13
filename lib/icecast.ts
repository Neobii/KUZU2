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
