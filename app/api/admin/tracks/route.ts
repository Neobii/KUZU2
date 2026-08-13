import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const url = new URL(req.url)
  const take = Math.min(parseInt(url.searchParams.get('take') ?? '100', 10) || 100, 500)
  const search = url.searchParams.get('search')?.trim()
  const where = search
    ? {
        OR: [
          { songTitle: { contains: search } },
          { artist: { contains: search } },
          { album: { contains: search } },
          { label: { contains: search } },
        ],
      }
    : {}
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
