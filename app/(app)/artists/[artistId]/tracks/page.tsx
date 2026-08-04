import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { prettifySimpleTime } from '@/lib/utils'

export default async function ArtistTracksPage({
  params,
}: {
  params: Promise<{ artistId: string }>
}) {
  const { artistId } = await params
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, artistName: true },
  })
  if (!artist) notFound()

  const tracks = await prisma.tracklist.findMany({
    where: { artistId },
    orderBy: [{ playDate: 'desc' }, { createdAt: 'desc' }],
    include: { show: { select: { showName: true } } },
  })

  return (
    <div>
      <p className="mb-2">
        <Link href="/artists" className="text-amber-400 no-underline hover:text-amber-300">
          ← Artists
        </Link>
      </p>
      <h2 className="mb-4 text-xl font-semibold text-stone-100">
        {artist.artistName} — Tracks ({tracks.length})
      </h2>
      {tracks.length === 0 ? (
        <p className="text-stone-400">No tracks linked to this artist yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-stone-200">
            <thead>
              <tr className="border-b border-stone-600 bg-stone-900/80 text-stone-300">
                <th className="border-b border-stone-700 px-3 py-2">Title</th>
                <th className="border-b border-stone-700 px-3 py-2">Album</th>
                <th className="border-b border-stone-700 px-3 py-2">Label</th>
                <th className="border-b border-stone-700 px-3 py-2">Length</th>
                <th className="border-b border-stone-700 px-3 py-2">Show</th>
                <th className="border-b border-stone-700 px-3 py-2">Played</th>
                <th className="border-b border-stone-700 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="border-b border-stone-800">
                  <td className="border-b border-stone-700 px-3 py-2">{track.songTitle}</td>
                  <td className="border-b border-stone-700 px-3 py-2">{track.album ?? '—'}</td>
                  <td className="border-b border-stone-700 px-3 py-2">{track.label ?? '—'}</td>
                  <td className="border-b border-stone-700 px-3 py-2">{track.trackLength ?? '—'}</td>
                  <td className="border-b border-stone-700 px-3 py-2">
                    {track.show?.showName ?? '—'}
                  </td>
                  <td className="border-b border-stone-700 px-3 py-2">
                    {track.playDate ? prettifySimpleTime(track.playDate) : '—'}
                  </td>
                  <td className="border-b border-stone-700 px-3 py-2">
                    <Link href={`/edit-track/${track.id}`} className="text-amber-400 no-underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
