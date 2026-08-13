import { prisma } from '@/lib/prisma'
import { formatLocalArtistShowHtml } from '@/lib/tracking-additional-info'

/** Inclusive window: shows within ±1 month of "now". */
export function localArtistShowDateWindow(now = new Date()): { from: Date; to: Date } {
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)
  from.setMonth(from.getMonth() - 1)

  const to = new Date(now)
  to.setHours(23, 59, 59, 999)
  to.setMonth(to.getMonth() + 1)

  return { from, to }
}

/** Parse admin date input (YYYY-MM-DD or ISO) to a Date, or null to clear. */
export function parseArtistShowDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Date-only: treat as local calendar day noon UTC-ish via Date parse of YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatShowDateInputValue(showDate: Date | string | null | undefined): string {
  if (!showDate) return ''
  const d = typeof showDate === 'string' ? new Date(showDate) : showDate
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/**
 * When a local artist is currently playing and the display flag is on,
 * return the latest active show within ±1 month of today.
 */
export async function getCurrentLocalArtistShowHtml(): Promise<string | null> {
  const productionStatus = await prisma.productionStatus.findFirst({
    where: { isActive: true },
  })
  if (!productionStatus?.isDisplayingLocalArtistShows) return null

  const track = await prisma.tracklist.findFirst({
    where: { playDate: { not: null } },
    orderBy: { playDate: 'desc' },
    select: { artistId: true, artist: true },
  })
  if (!track) return null

  let artist =
    track.artistId != null
      ? await prisma.artist.findUnique({ where: { id: track.artistId } })
      : null

  if (!artist && track.artist?.trim()) {
    artist = await prisma.artist.findFirst({
      where: {
        isLocalArtist: true,
        artistName: { equals: track.artist.trim(), mode: 'insensitive' },
      },
    })
  }

  if (!artist?.isLocalArtist) return null

  const { from, to } = localArtistShowDateWindow()
  const show = await prisma.artistShow.findFirst({
    where: {
      artistId: artist.id,
      isActive: true,
      showDate: { gte: from, lte: to },
    },
    orderBy: { showDate: 'desc' },
    include: { artist: { select: { artistName: true } } },
  })
  if (!show) return null

  const html = formatLocalArtistShowHtml(show)
  return html.trim() ? html : null
}
