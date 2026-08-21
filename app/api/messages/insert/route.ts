import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  })
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }
  const body = await req.json().catch(() => ({}))
  const { messageBody = '', sentBy = '' } = body
  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
  })
  // Match GET /api/tracking/has-messaging: public clients hide the form when
  // messaging is off, but this unauthenticated CORS endpoint must enforce the
  // same flag or anyone can inject into the producer inbox for a live show.
  if (!activeShow?.hasMessagingEnabled) {
    return NextResponse.json({ ok: false }, { status: 403, headers })
  }
  if (messageBody) {
    await prisma.message.create({
      data: {
        content: messageBody,
        sentBy,
        showId: activeShow.id,
        producerId: activeShow.userId,
      },
    })
  }
  return NextResponse.json({ ok: true }, { headers })
}
