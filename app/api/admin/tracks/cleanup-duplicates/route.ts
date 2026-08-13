import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { cleanupNearDuplicateStreamTracks } from '@/lib/stream-track-log'

export const dynamic = 'force-dynamic'

/** Admin one-time / on-demand cleanup for duplicate stream track rows. */
export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const result = await cleanupNearDuplicateStreamTracks()
  return NextResponse.json({ ok: true, ...result })
}
