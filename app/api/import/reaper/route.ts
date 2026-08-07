import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHighestTrackNumber } from '@/lib/show-actions'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

type Row = { Name?: string; Meta?: string; Album?: string; Label?: string; Length?: string }

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const showId = body.showId as string
  const data = body.data as Row[]
  if (!showId || !Array.isArray(data)) {
    return NextResponse.json({ error: 'showId and data required' }, { status: 400 })
  }

  const access = await requireShowAccess(showId, auth.userId)
  if ('error' in access) return access.error

  const regex = /%(.*)%/
  let base = await getHighestTrackNumber(showId)
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (!item?.Name) continue
    const match = item.Meta?.match(regex)
    if (!match) {
      const names = item.Name.split('|')
      if (!names[1]) continue
      base += 1
      await prisma.tracklist.create({
        data: {
          showId,
          artist: names[0],
          songTitle: names[1],
          album: item.Album,
          label: item.Label,
          trackLength: item.Length,
          indexNumber: base,
        },
      })
    } else {
      base += 1
      await prisma.tracklist.create({
        data: {
          showId,
          artist: ' ',
          songTitle: item.Name,
          album: ' ',
          label: ' ',
          trackLength: item.Length,
          trackType: match[1],
          indexNumber: base,
        },
      })
    }
  }
  return NextResponse.json({ ok: true })
}
