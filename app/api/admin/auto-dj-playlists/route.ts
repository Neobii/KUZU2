import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const list = await prisma.autoDJPlaylist.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const created = await prisma.autoDJPlaylist.create({
    data: {
      name: String(body.name ?? 'Playlist'),
      showSchedules: body.showSchedules ?? [],
    },
  })
  return NextResponse.json(created)
}
