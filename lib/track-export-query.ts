import { prisma } from '@/lib/prisma'

export type LicensingExportRow = {
  playDate: Date | null
  songTitle: string
  artist: string | null
  album: string | null
  label: string | null
  trackLength: string | null
}

export async function fetchLicensingExportRows(
  from: Date,
  toExclusive: Date
): Promise<LicensingExportRow[]> {
  return prisma.tracklist.findMany({
    where: {
      trackType: 'song',
      playDate: { not: null, gte: from, lt: toExclusive },
    },
    select: {
      playDate: true,
      songTitle: true,
      artist: true,
      album: true,
      label: true,
      trackLength: true,
    },
    orderBy: { playDate: 'asc' },
  })
}
