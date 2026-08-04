import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { showId } = await params
  const body = await req.json()
  const userId = (session.user as { id?: string }).id
  const hasProducerMessageField = body.currentShowProducerMessage !== undefined
  if (hasProducerMessageField) {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : null
    const canWrite = !!user?.isAdmin || !!user?.isBoardMember || !!user?.isFieldProducer
    const show = await prisma.show.findUnique({ where: { id: showId } })
    const isOwner = !!show && show.userId === userId
    const isHelper = !!show && show.helperUserId === userId
    const isClear = body.currentShowProducerMessage === null
    if (!canWrite && !(isClear && (isOwner || isHelper))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  const normalizedProducerMessage =
    hasProducerMessageField && typeof body.currentShowProducerMessage === 'string'
      ? body.currentShowProducerMessage.trim() || null
      : body.currentShowProducerMessage
  const show = await prisma.show.update({
    where: { id: showId },
    data: {
      ...(body.showName != null && { showName: String(body.showName) }),
      ...(body.showStart != null && { showStart: new Date(body.showStart) }),
      ...(body.showEnd != null && { showEnd: new Date(body.showEnd) }),
      ...(body.defaultMeta != null && { defaultMeta: String(body.defaultMeta) }),
      ...(body.description != null && { description: String(body.description) }),
      ...(body.hasRadioLogikTracking != null && {
        hasRadioLogikTracking: Boolean(body.hasRadioLogikTracking),
      }),
      ...(body.hasMessagingEnabled != null && {
        hasMessagingEnabled: Boolean(body.hasMessagingEnabled),
      }),
      ...(body.autoplayOnStart != null && {
        autoplayOnStart: Boolean(body.autoplayOnStart),
      }),
      ...(body.autoplayOnDate != null && {
        autoplayOnDate: Boolean(body.autoplayOnDate),
      }),
      ...(body.isShowingDescription != null && {
        isShowingDescription: Boolean(body.isShowingDescription),
      }),
      ...(body.isShowingDefaultMeta != null && {
        isShowingDefaultMeta: Boolean(body.isShowingDefaultMeta),
      }),
      ...(body.episodeNumber === null && { episodeNumber: null }),
      ...(body.episodeNumber != null && { episodeNumber: Number(body.episodeNumber) }),
      ...(hasProducerMessageField && {
        currentShowProducerMessage: normalizedProducerMessage as string | null,
      }),
    },
  })
  return NextResponse.json(show)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { showId } = await params
  await prisma.tracklist.deleteMany({ where: { showId } })
  await prisma.message.deleteMany({ where: { showId } })
  await prisma.show.delete({ where: { id: showId } })
  return NextResponse.json({ ok: true })
}
