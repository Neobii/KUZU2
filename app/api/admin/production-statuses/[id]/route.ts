import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await req.json()
  const updated = await prisma.productionStatus.update({
    where: { id },
    data: {
      ...(body.productionStatusName != null && {
        productionStatusName: String(body.productionStatusName),
      }),
      ...(body.metaData !== undefined && { metaData: body.metaData }),
      ...(body.isShowingMetaData !== undefined && {
        isShowingMetaData: Boolean(body.isShowingMetaData),
      }),
      ...(body.additionalContent !== undefined && {
        additionalContent: String(body.additionalContent),
      }),
      ...(body.isShowingAdditionalContent !== undefined && {
        isShowingAdditionalContent: Boolean(body.isShowingAdditionalContent),
      }),
      ...(body.isDisplayingLocalArtistShows !== undefined && {
        isDisplayingLocalArtistShows: Boolean(body.isDisplayingLocalArtistShows),
      }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      ...(body.producersNote !== undefined && {
        producersNote: String(body.producersNote),
      }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params
  await prisma.productionStatus.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
