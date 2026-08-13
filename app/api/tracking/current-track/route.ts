import { NextResponse } from 'next/server'
import { getCurrentTrackString } from '@/lib/current-track'
import { trackingCorsHeaders } from '@/lib/tracking-additional-info'

export const dynamic = 'force-dynamic'

export async function GET() {
  const track = await getCurrentTrackString()
  return NextResponse.json(track, { headers: trackingCorsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: trackingCorsHeaders })
}
