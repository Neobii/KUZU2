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
  if (activeShow && messageBody) {
    await prisma.message.create({
      data: {
        content: messageBody,
        sentBy,
        showId: activeShow.id,
        authorId: activeShow.userId,
        targetRole: 'all',
      },
    })
  }
  return NextResponse.json({ ok: true }, { headers })
}
