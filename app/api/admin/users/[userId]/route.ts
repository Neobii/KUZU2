import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { userId } = await params
  const body = await req.json()
  const current = await prisma.user.findUnique({ where: { id: userId } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile =
    body.profile && typeof body.profile === 'object'
      ? { ...((current.profile as object) ?? {}), ...body.profile }
      : undefined
  const producerProfile =
    body.producerProfile && typeof body.producerProfile === 'object'
      ? { ...((current.producerProfile as object) ?? {}), ...body.producerProfile }
      : undefined

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(profile !== undefined && { profile }),
      ...(producerProfile !== undefined && { producerProfile }),
      ...(body.isAdmin !== undefined && { isAdmin: Boolean(body.isAdmin) }),
      ...(body.isProducer !== undefined && { isProducer: Boolean(body.isProducer) }),
      ...(body.isBoardMember !== undefined && {
        isBoardMember: Boolean(body.isBoardMember),
      }),
      ...(body.isFieldProducer !== undefined && {
        isFieldProducer: Boolean(body.isFieldProducer),
      }),
      ...(body.isManagingArtists !== undefined && {
        isManagingArtists: Boolean(body.isManagingArtists),
      }),
    },
    select: {
      id: true,
      email: true,
      profile: true,
      producerProfile: true,
      isProducer: true,
      isAdmin: true,
      isBoardMember: true,
      isFieldProducer: true,
      isManagingArtists: true,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { userId } = await params
  if (userId === auth.userId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }
  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
