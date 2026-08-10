function escCell(v: unknown, delimiter: string): string {
  const s = v == null ? '' : String(v)
  if (s.includes('"') || s.includes('\n') || s.includes(delimiter)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

type TrackRow = {
  trackType: string
  songTitle: string
  artist: string | null
  album: string | null
  label: string | null
  trackLength: string | null
  playDate: Date | null
  indexNumber: number | null
}

type LicensingTrackRow = {
  playDate: Date | null
  songTitle: string
  artist: string | null
  album: string | null
  label: string | null
  trackLength: string | null
}

function na(value: unknown): string {
  if (value == null || value === '') return 'NA'
  return String(value)
}

/** Meteor `downloadTracksCSV` — pipe-delimited, songs only, licensing columns. */
export function licensingTracksToPipeCsv(rows: LicensingTrackRow[]): string {
  const delimiter = '|'
  const headers = ['playDate', 'songTitle', 'artist', 'albumName', 'label', 'trackLength']
  const lines = [headers.join(delimiter)]
  for (const row of rows) {
    lines.push(
      [
        row.playDate ? row.playDate.toISOString() : 'NA',
        na(row.songTitle),
        na(row.artist),
        na(row.album),
        na(row.label),
        na(row.trackLength),
      ]
        .map((v) => escCell(v, delimiter))
        .join(delimiter)
    )
  }
  return lines.join('\n')
}

export function tracksToDelimited(
  rows: TrackRow[],
  delimiter: string,
  includeHeader: boolean
): string {
  const headers = [
    'trackType',
    'songTitle',
    'artist',
    'album',
    'label',
    'trackLength',
    'playDate',
    'indexNumber',
  ]
  const lines: string[] = []
  if (includeHeader) {
    lines.push(headers.map((h) => escCell(h, delimiter)).join(delimiter))
  }
  for (const r of rows) {
    lines.push(
      [
        r.trackType,
        r.songTitle,
        r.artist,
        r.album,
        r.label,
        r.trackLength,
        r.playDate ? r.playDate.toISOString() : '',
        r.indexNumber,
      ]
        .map((v) => escCell(v, delimiter))
        .join(delimiter)
    )
  }
  return lines.join('\n')
}
