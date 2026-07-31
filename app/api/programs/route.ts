import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type ProfileJson = { name?: string } | null
type ProducerProfileJson = { bio?: string } | null

// Mirrors the kuzu.fm/programs listing: show name, day/date/time (start+end),
// host, show description, frequency, genre, connect links, KUZU premiere.
// Fields the public site renders that have no DB column yet come back as null.
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
      isShowingDescription: true,
      defaultMeta: true,
      isShowingDefaultMeta: true,
      showStart: true,
      showEnd: true,
      owner: {
        select: {
          profile: true,
          producerProfile: true,
          email: true,
        },
      },
    },
    orderBy: { showStart: 'asc' },
  })

  const programs = shows
    .filter((show) => show.description && show.description.trim().length > 0)
    .map((show) => {
      const profile = show.owner.profile as ProfileJson
      const producerProfile = show.owner.producerProfile as ProducerProfileJson
      return {
        // Stable keys — existing consumers rely on these:
        id: show.id,
        name: show.showName,
        // The SHOW's own description (show.description) — NOT the producer's
        // profile bio, which is returned separately as hostBio.
        description: show.description,
        start: show.showStart,
        end: show.showEnd,
        hostName: profile?.name ?? show.owner.email.split('@')[0] ?? 'Unknown',
        // Media-player meta for the show, only when the producer opts in.
        defaultMeta: show.isShowingDefaultMeta ? show.defaultMeta : null,
        // Producer's overall profile bio (producerProfile.bio) — kept apart from
        // `description` so the public site can render "About the host" separately.
        hostBio: producerProfile?.bio ?? null,
        // Listed on kuzu.fm/programs but not stored in the DB yet:
        frequency: null,
        genre: null,
        connect: null,
        kuzuPremiere: null,
        // Visibility flags so the public site knows what to render:
        isShowingDefaultMeta: show.isShowingDefaultMeta,
        isShowingDescription: show.isShowingDescription,
      }
    })

  return NextResponse.json(programs)
}
