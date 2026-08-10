import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Build HTML for a local artist show promo (flyer + TipTap content). */
export function formatLocalArtistShowHtml(show: {
  flyerImageUrl: string | null
  content: string | null
  artist: { artistName: string }
}): string {
  const parts: string[] = []
  if (show.flyerImageUrl?.trim()) {
    const src = escapeHtmlAttr(show.flyerImageUrl.trim())
    const alt = escapeHtmlAttr(show.artist.artistName)
    parts.push(`<img src="${src}" alt="${alt}" />`)
  }
  const content = show.content?.trim()
  if (content) parts.push(content)
  return parts.length > 0 ? parts.join('') : ' '
}

async function getLocalArtistShowHtml(): Promise<string | null> {
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

  const show = await prisma.artistShow.findFirst({
    where: { artistId: artist.id, isActive: true },
    orderBy: { updatedAt: 'desc' },
    include: { artist: { select: { artistName: true } } },
  })
  if (!show) return null

  const html = formatLocalArtistShowHtml(show)
  return html.trim() ? html : null
}

/** Mirrors legacy Meteor `getCurrentAdditionalInfo`, plus local artist show promos. */
export async function getCurrentAdditionalInfo(): Promise<string> {
  const [productionStatus, show] = await Promise.all([
    prisma.productionStatus.findFirst({ where: { isActive: true } }),
    prisma.show.findFirst({ where: { isActive: true } }),
  ])

  if (productionStatus?.isDisplayingLocalArtistShows) {
    const localHtml = await getLocalArtistShowHtml()
    if (localHtml) return localHtml
  }

  if (productionStatus?.isShowingAdditionalContent) {
    return productionStatus.additionalContent ?? ' '
  }
  if (show?.isShowingDescription) {
    return show.description ?? ' '
  }
  return ' '
}

export function hashAdditionalInfo(content: string): string {
  return createHash('sha1').update(content).digest('hex')
}

export const trackingCorsHeaders = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}
