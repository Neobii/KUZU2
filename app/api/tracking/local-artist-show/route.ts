import { NextResponse } from 'next/server'
import { getCurrentLocalArtistShowHtml } from '@/lib/local-artist-show'
import { trackingCorsHeaders } from '@/lib/tracking-additional-info'

export const dynamic = 'force-dynamic'

/** Dedicated local-artist promo feed (separate from current-additional-info). */
export async function GET() {
  const content = await getCurrentLocalArtistShowHtml()
  return NextResponse.json(content ?? ' ', { headers: trackingCorsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: trackingCorsHeaders })
}
