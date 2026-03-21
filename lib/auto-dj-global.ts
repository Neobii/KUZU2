/** Pending Auto DJ track (from RadioLogik when no active show with tracking off) */
export type AutoDJTrackPayload = {
  artist: string
  songTitle: string
  album: string
  label: string
  duration: string
  playDate: Date
}

let pending: AutoDJTrackPayload | null = null

export function setPendingAutoDJTrack(t: AutoDJTrackPayload | null) {
  pending = t
}

export function getPendingAutoDJTrack() {
  return pending
}
