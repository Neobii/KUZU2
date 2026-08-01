import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setPendingAutoDJTrack } from '@/lib/auto-dj-global'
import { autoplayNextTrack } from '@/lib/show-actions'

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
    await prisma.tracklist.create({
      data: {
        artist,
        songTitle,
        album,
        label: cleanLabel,
        trackLength: duration,
        playDate: new Date(),
      },
    })
    const nextArmed = await prisma.show.findFirst({
      where: { isArmedForAutoStart: true },
    })
    if (nextArmed) {
      ;(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted = false
      await prisma.show.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      await prisma.show.update({
        where: { id: nextArmed.id },
        data: { isActive: true, isArmedForAutoStart: false },
      })
      if (nextArmed.autoplayOnDate) {
        await autoplayNextTrack()
      }
    }
  } else if (!activeShow || activeShow.hasRadioLogikTracking) {
    ;(global as unknown as { preshowTracksStarted?: boolean }).preshowTracksStarted = false
    await prisma.tracklist.create({
      data: {
        artist,
        songTitle,
        album,
        label,
        trackLength: duration,
        playDate: new Date(),
      },
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
