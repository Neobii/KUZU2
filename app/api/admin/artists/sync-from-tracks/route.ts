import { NextResponse } from 'next/server'
import { requireArtistManager } from '@/lib/require-admin'
import { syncArtistsFromTracklist } from '@/lib/artist-resolve'

export const dynamic = 'force-dynamic'

/** Create Artist rows and link tracklist entries that only have artist text. */
export async function POST() {
  const auth = await requireArtistManager()
  if ('error' in auth) return auth.error

  const result = await syncArtistsFromTracklist()
  return NextResponse.json({ ok: true, ...result })
}
