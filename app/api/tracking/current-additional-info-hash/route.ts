import { NextResponse } from 'next/server'
import {
  getCurrentAdditionalInfo,
  hashAdditionalInfo,
  trackingCorsHeaders,
} from '@/lib/tracking-additional-info'

export const dynamic = 'force-dynamic'

export async function GET() {
  const content = await getCurrentAdditionalInfo()
  return NextResponse.json(hashAdditionalInfo(content), { headers: trackingCorsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: trackingCorsHeaders })
}
