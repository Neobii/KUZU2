import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireArtistManager } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; showId: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id, showId } = await params
  const existing = await prisma.artistShow.findFirst({
    where: { id: showId, artistId: id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const data: {
    flyerImageUrl?: string | null
    content?: string | null
    isActive?: boolean
  } = {}
  if (body.flyerImageUrl !== undefined) {
    data.flyerImageUrl =
      typeof body.flyerImageUrl === 'string' && body.flyerImageUrl.trim() !== ''
        ? body.flyerImageUrl.trim()
        : null
  }
  if (body.content !== undefined) {
    data.content = typeof body.content === 'string' ? body.content : null
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

  const show = await prisma.artistShow.update({ where: { id: showId }, data })
  return NextResponse.json({ show })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; showId: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id, showId } = await params
  const existing = await prisma.artistShow.findFirst({
    where: { id: showId, artistId: id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.artistShow.delete({ where: { id: showId } })
  return NextResponse.json({ ok: true })
}
