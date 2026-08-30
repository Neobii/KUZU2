import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireTrackAccess } from '@/lib/show-access'
import { deleteTrackFromShow } from '@/lib/show-actions'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { trackId } = await params
  const access = await requireTrackAccess(trackId, auth.userId)
  if ('error' in access) return access.error

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.songTitle != null) data.songTitle = body.songTitle
  if (body.artist != null) data.artist = body.artist
  if (body.artistId !== undefined) {
    if (body.artistId === null || body.artistId === '') {
      data.artistId = null
    } else {
      const artistRow = await prisma.artist.findUnique({ where: { id: String(body.artistId) } })
      if (!artistRow) return NextResponse.json({ error: 'Artist not found' }, { status: 400 })
      data.artistId = artistRow.id
    }
  }
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
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { trackId } = await params
  const access = await requireTrackAccess(trackId, auth.userId)
  if ('error' in access) return access.error

  await deleteTrackFromShow(trackId)
  return NextResponse.json({ ok: true })
}
