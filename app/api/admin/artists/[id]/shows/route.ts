import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireArtistManager } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id } = await params
  const artist = await prisma.artist.findUnique({ where: { id } })
  if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const shows = await prisma.artistShow.findMany({
    where: { artistId: id },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ shows })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id } = await params
  const artist = await prisma.artist.findUnique({ where: { id } })
  if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const show = await prisma.artistShow.create({
    data: {
      artistId: id,
      flyerImageUrl:
        typeof body.flyerImageUrl === 'string' && body.flyerImageUrl.trim() !== ''
          ? body.flyerImageUrl.trim()
          : null,
      content: typeof body.content === 'string' ? body.content : null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    },
  })
  return NextResponse.json({ show }, { status: 201 })
}
