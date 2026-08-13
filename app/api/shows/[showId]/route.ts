import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { canWriteProducerMessage, requireShowAccess } from '@/lib/show-access'
import { scheduleStopShowAtEnd } from '@/lib/cron'
import { deleteShow } from '@/lib/show-actions'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { showId } = await params
  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  const body = await req.json()
  const hasProducerMessageField = body.currentShowProducerMessage !== undefined

  if (
    hasProducerMessageField &&
    !canWriteProducerMessage(
      access.user,
      access.show,
      auth.userId,
      body.currentShowProducerMessage as string | null
    )
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      ...(body.stopAfterLastSong != null && {
        stopAfterLastSong: Boolean(body.stopAfterLastSong),
      }),
      ...(body.stopOnCalendarEnd != null && {
        stopOnCalendarEnd: Boolean(body.stopOnCalendarEnd),
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
  if (
    body.showEnd !== undefined ||
    body.stopOnCalendarEnd !== undefined
  ) {
    scheduleStopShowAtEnd(showId)
  }
  return NextResponse.json(show)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { showId } = await params
  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  await deleteShow(showId)
  return NextResponse.json({ ok: true })
}
