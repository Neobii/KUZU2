import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireShowCreateAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const access = await requireShowCreateAccess(auth.userId)
  if ('error' in access) return access.error

  const producerProfile = access.user.producerProfile as {
    showName?: string
    description?: string
    defaultMeta?: string
    isMessagingUIEnabled?: boolean
  } | null
  const body = (await request.json().catch(() => ({}))) as {
    autoplayOnStart?: boolean
    autoplayOnDate?: boolean
    stopAfterLastSong?: boolean
    stopOnCalendarEnd?: boolean
  }
  const show = await prisma.show.create({
    data: {
      userId: auth.userId,
      showName: producerProfile?.showName?.trim() || 'Kuzu Show',
      description: producerProfile?.description ?? ' ',
      defaultMeta: producerProfile?.defaultMeta ?? 'Kuzu Show',
      hasMessagingEnabled: producerProfile?.isMessagingUIEnabled ?? false,
      autoplayOnStart: typeof body.autoplayOnStart === 'boolean' ? body.autoplayOnStart : false,
      autoplayOnDate: typeof body.autoplayOnDate === 'boolean' ? body.autoplayOnDate : false,
      stopAfterLastSong:
        typeof body.stopAfterLastSong === 'boolean' ? body.stopAfterLastSong : false,
      stopOnCalendarEnd:
        typeof body.stopOnCalendarEnd === 'boolean' ? body.stopOnCalendarEnd : false,
    },
  })
  return NextResponse.json(show)
}
