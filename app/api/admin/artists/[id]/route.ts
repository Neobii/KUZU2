import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireArtistManager } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await req.json()
  const existing = await prisma.artist.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: {
    artistName?: string
    imageUrl?: string
    bio?: string
    isLocalArtist?: boolean
  } = {}
  if (body.artistName !== undefined) {
    const artistName = String(body.artistName).trim()
    if (!artistName) {
      return NextResponse.json({ error: 'artistName cannot be empty' }, { status: 400 })
    }
    data.artistName = artistName
  }
  if (body.imageUrl !== undefined) data.imageUrl = String(body.imageUrl)
  if (body.bio !== undefined) data.bio = String(body.bio)
  if (body.isLocalArtist !== undefined) data.isLocalArtist = Boolean(body.isLocalArtist)

  const artist = await prisma.artist.update({ where: { id }, data })
  return NextResponse.json({ artist })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error
  const { id } = await params
  const existing = await prisma.artist.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.artist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
