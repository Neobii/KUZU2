export type IcecastSource = {
  listeners?: number
}

export type IcecastStats = {
  icestats?: {
    source?: IcecastSource | IcecastSource[]
  }
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
  return process.env.ICECAST_STATUS_URL ?? 'http://138.197.2.189:8000/status-json.xsl'
}

export function getListenerPollIntervalMs(): number {
  const parsed = parseInt(process.env.LISTENER_POLL_MS ?? '300000', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300000
}
