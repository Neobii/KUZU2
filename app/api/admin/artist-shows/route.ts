import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

/** All local-artist show promos for the Admin Shows page. */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const shows = await prisma.artistShow.findMany({
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    include: {
      artist: {
        select: {
          id: true,
          artistName: true,
          isLocalArtist: true,
        },
      },
    },
  })

  return NextResponse.json({ shows })
}
