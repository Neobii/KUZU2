import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { streamTrackArtistFields } from '@/lib/artist-resolve'
import { createStreamTrackLog } from '@/lib/stream-track-log'
import { setPendingAutoDJTrack } from '@/lib/auto-dj-global'
import { autoplayNextTrack, clearActiveShowRuntime } from '@/lib/show-actions'
import { scheduleStopShowAtEnd } from '@/lib/cron'
import { canActivateArmedShowFromTrackingInsert } from '@/lib/tracking-insert-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  })
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }
  const body = await req.json().catch(() => ({}))
  const { artist = '', songTitle = '', album = '', label = '', duration = '' } = body
  const artistFields = await streamTrackArtistFields(typeof artist === 'string' ? artist : '')
  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
  })
  const armedShow = await prisma.show.findFirst({
    where: { isArmedForAutoStart: true },
  })
  if (armedShow && typeof label === 'string' && label.includes('<><>')) {
    const cleanLabel = label.replace(/<><>/g, '')
    if (!(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted) {
      ;(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted = true
    }
    await createStreamTrackLog({
      ...artistFields,
      songTitle: typeof songTitle === 'string' ? songTitle : '',
      album: typeof album === 'string' ? album : null,
      label: cleanLabel,
      trackLength: typeof duration === 'string' ? duration : null,
    })
    // Go Live from this public CORS endpoint must be authenticated. Without a
    // matching TRACKING_INSERT_SECRET Bearer, still log the track but do not
    // displace the on-air show.
    if (!canActivateArmedShowFromTrackingInsert(req.headers.get('authorization'))) {
      return NextResponse.json({ ok: true, activated: false }, { headers })
    }
    const nextArmed = await prisma.show.findFirst({
      where: { isArmedForAutoStart: true },
    })
    if (nextArmed) {
      ;(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted = false
      // Same live handoff as activateShow: drop prior timers/jobs, then arm
      // calendar-end stop for the newly live show.
      await clearActiveShowRuntime()
      await prisma.show.update({
        where: { id: nextArmed.id },
        data: { isActive: true, isArmedForAutoStart: false },
      })
      scheduleStopShowAtEnd(nextArmed.id)
      if (nextArmed.autoplayOnDate) {
        await autoplayNextTrack()
      }
    }
  } else if (!activeShow || activeShow.hasRadioLogikTracking) {
    ;(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted = false
    await createStreamTrackLog({
      ...artistFields,
      songTitle: typeof songTitle === 'string' ? songTitle : '',
      album: typeof album === 'string' ? album : null,
      label: typeof label === 'string' ? label : null,
      trackLength: typeof duration === 'string' ? duration : null,
    })
  } else {
    setPendingAutoDJTrack({
      artist,
      songTitle,
      album,
      label,
      duration,
      playDate: new Date(),
    })
  }
  return NextResponse.json({ ok: true }, { headers })
}
