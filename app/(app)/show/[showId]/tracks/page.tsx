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
      <h2>{show.showName} — Tracks</h2>
      <p>
        <Link href={`/addTrackToShow/${showId}`}>Add Track</Link>
        {' | '}
        <Link href={`/edit-show/${showId}`}>Edit Show</Link>
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Album</th>
            <th>Label</th>
            <th>Played</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => (
            <tr key={track.id} className="track">
              <td>{track.indexNumber ?? i + 1}</td>
              <td>{track.songTitle}</td>
              <td>{track.artist}</td>
              <td>{track.album}</td>
              <td>{track.label}</td>
              <td>{track.playDate ? prettifySimpleTime(track.playDate) : '-'}</td>
              <td>
                <Link href={`/edit-track/${track.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
