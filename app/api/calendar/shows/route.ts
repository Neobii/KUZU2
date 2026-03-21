import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const start = new Date(url.searchParams.get('start') ?? '')
  const end = new Date(url.searchParams.get('end') ?? '')
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }
  const shows = await prisma.show.findMany({
    where: {
      showStart: { gte: start, lte: end },
    },
    select: {
      id: true,
      showName: true,
      showStart: true,
      showEnd: true,
    },
    orderBy: { showStart: 'asc' },
  })
  return NextResponse.json(shows)
}
