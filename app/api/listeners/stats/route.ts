import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStatsAccess } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireStatsAccess()
  if ('error' in auth) return auth.error

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
