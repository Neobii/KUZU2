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
  const timeFrom = new Date(url.searchParams.get('from') ?? '')
  const timeTo = new Date(url.searchParams.get('to') ?? '')
  if (isNaN(timeFrom.getTime()) || isNaN(timeTo.getTime())) {
    return NextResponse.json({ error: 'from and to required' }, { status: 400 })
  }
  const rows = await prisma.listenerStat.findMany({
    where: { fetchDate: { gte: timeFrom, lte: timeTo } },
    orderBy: { fetchDate: 'asc' },
  })
  return NextResponse.json(rows)
}
