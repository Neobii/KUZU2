import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireArtistManager } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const artists = await prisma.artist.findMany({
    orderBy: { artistName: 'asc' },
    include: {
      _count: { select: { tracks: true, shows: true } },
      shows: { orderBy: { updatedAt: 'desc' } },
    },
  })
  return NextResponse.json({ artists })
}

export async function POST(req: NextRequest) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const artistName = typeof body.artistName === 'string' ? body.artistName.trim() : ''
  if (!artistName) {
    return NextResponse.json({ error: 'artistName is required' }, { status: 400 })
  }
  const artist = await prisma.artist.create({
    data: {
      artistName,
      isLocalArtist: Boolean(body.isLocalArtist),
      ...(typeof body.imageUrl === 'string' && body.imageUrl.trim() !== ''
        ? { imageUrl: body.imageUrl.trim() }
        : {}),
      ...(typeof body.bio === 'string' && body.bio.trim() !== '' ? { bio: body.bio.trim() } : {}),
    },
  })
  return NextResponse.json({ artist }, { status: 201 })
}
