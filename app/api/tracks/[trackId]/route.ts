import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { trackId } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.songTitle != null) data.songTitle = body.songTitle
  if (body.artist != null) data.artist = body.artist
  if (body.album != null) data.album = body.album
  if (body.label != null) data.label = body.label
  if (body.trackLength != null) data.trackLength = body.trackLength
  if (body.trackType != null) data.trackType = body.trackType
  const track = await prisma.tracklist.update({
    where: { id: trackId },
    data,
  })
  return NextResponse.json(track)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { trackId } = await params
  await prisma.tracklist.delete({ where: { id: trackId } })
  return NextResponse.json({ ok: true })
}
