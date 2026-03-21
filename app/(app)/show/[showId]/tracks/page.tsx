import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifySimpleTime } from '@/lib/utils'

export default async function ShowTracksPage({
  params,
}: {
  params: Promise<{ showId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { showId } = await params
  const show = await prisma.show.findUnique({
    where: { id: showId },
  })
  if (!show) notFound()
  const tracks = await prisma.tracklist.findMany({
    where: { showId },
    orderBy: { indexNumber: 'asc' },
  })

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-stone-100">{show.showName} — Tracks</h2>
      <p className="mb-4 flex flex-wrap gap-2 text-amber-400">
        <Link href={`/addTrackToShow/${showId}`} className="no-underline">
          Add Track
        </Link>
        <span className="text-stone-600">|</span>
        <Link href={`/edit-show/${showId}`} className="no-underline">
          Edit Show
        </Link>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-stone-200">
          <thead>
            <tr className="border-b border-stone-600 bg-stone-900/80 text-stone-300">
              <th className="border-b border-stone-700 px-3 py-2">#</th>
              <th className="border-b border-stone-700 px-3 py-2">Title</th>
              <th className="border-b border-stone-700 px-3 py-2">Artist</th>
              <th className="border-b border-stone-700 px-3 py-2">Album</th>
              <th className="border-b border-stone-700 px-3 py-2">Label</th>
              <th className="border-b border-stone-700 px-3 py-2">Played</th>
              <th className="border-b border-stone-700 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => (
              <tr key={track.id} className="track border-b border-stone-800">
                <td className="border-b border-stone-700 px-3 py-2">{track.indexNumber ?? i + 1}</td>
                <td className="border-b border-stone-700 px-3 py-2">{track.songTitle}</td>
                <td className="border-b border-stone-700 px-3 py-2">{track.artist}</td>
                <td className="border-b border-stone-700 px-3 py-2">{track.album}</td>
                <td className="border-b border-stone-700 px-3 py-2">{track.label}</td>
                <td className="border-b border-stone-700 px-3 py-2">
                  {track.playDate ? prettifySimpleTime(track.playDate) : '-'}
                </td>
                <td className="border-b border-stone-700 px-3 py-2">
                  <Link href={`/edit-track/${track.id}`} className="no-underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
