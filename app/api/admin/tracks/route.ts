import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'
import { isCalendarDateString, parseStationExportDateRange } from '@/lib/datetime-local'

export const dynamic = 'force-dynamic'

function parseListRange(dateFrom: string | null, dateTo: string | null) {
  if (!dateFrom || !dateTo) return null
  if (!isCalendarDateString(dateFrom) || !isCalendarDateString(dateTo)) return null
  return parseStationExportDateRange(dateFrom, dateTo)
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const url = new URL(req.url)
  const take = Math.min(parseInt(url.searchParams.get('take') ?? '100', 10) || 100, 500)
  const search = url.searchParams.get('search')?.trim()
  const range = parseListRange(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'))

  const where: {
    OR?: Array<Record<string, unknown>>
    playDate?: { not: null; gte: Date; lt: Date }
  } = {}

  if (search) {
    where.OR = [
      { songTitle: { contains: search, mode: 'insensitive' } },
      { artist: { contains: search, mode: 'insensitive' } },
      { album: { contains: search, mode: 'insensitive' } },
      { label: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (range && range.from < range.toExclusive) {
    where.playDate = { not: null, gte: range.from, lt: range.toExclusive }
  }

  const tracks = await prisma.tracklist.findMany({
    where,
    orderBy: { playDate: { sort: 'desc', nulls: 'last' } },
    take,
    include: {
      show: { select: { id: true, showName: true } },
    },
  })
  return NextResponse.json(tracks)
}
