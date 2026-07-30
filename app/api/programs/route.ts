import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const shows = await prisma.show.findMany({
    where: {
      showStart: { not: null },
      description: { not: null },
    },
    select: {
      id: true,
      showName: true,
      description: true,
      showStart: true,
      showEnd: true,
      owner: {
        select: {
          profile: true,
          email: true,
        },
      },
    },
    orderBy: { showStart: 'asc' },
  })

  const programs = shows
    .filter((show) => show.description && show.description.trim().length > 0)
    .map((show) => {
      const profile = show.owner.profile as { name?: string } | null
      return {
        id: show.id,
        name: show.showName,
        description: show.description,
        start: show.showStart,
        end: show.showEnd,
        hostName: profile?.name ?? show.owner.email.split('@')[0] ?? 'Unknown',
      }
    })

  return NextResponse.json(programs)
}
