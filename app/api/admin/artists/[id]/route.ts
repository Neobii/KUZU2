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
    imageUrl?: string | null
    bio?: string | null
    isLocalArtist?: boolean
  } = {}
  if (body.artistName !== undefined) {
    const artistName = String(body.artistName).trim()
    if (!artistName) {
      return NextResponse.json({ error: 'artistName cannot be empty' }, { status: 400 })
    }
    data.artistName = artistName
  }
  if (body.imageUrl !== undefined) {
    data.imageUrl =
      body.imageUrl === null || String(body.imageUrl).trim() === ''
        ? null
        : String(body.imageUrl).trim()
  }
  if (body.bio !== undefined) {
    data.bio =
      body.bio === null || String(body.bio).trim() === '' ? null : String(body.bio)
  }
  if (body.isLocalArtist !== undefined) data.isLocalArtist = Boolean(body.isLocalArtist)

  try {
    const artist = await prisma.artist.update({ where: { id }, data })
    return NextResponse.json({ artist })
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : ''
    if (code === 'P2002') {
      return NextResponse.json({ error: 'An artist with that name already exists' }, { status: 409 })
    }
    console.error('PATCH /api/admin/artists/[id]', e)
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 })
  }
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
