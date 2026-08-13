import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageShow } from '@/lib/show-access'
import { prettifySimpleTime } from '@/lib/utils'
import { DeleteTrackButton } from '@/components/show/DeleteTrackButton'
import { btnXsPrimary, tableCellClass, tableClass, tableHeadClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export default async function ShowTracksPage({
  params,
}: {
  params: Promise<{ showId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { showId } = await params
  const [show, user] = await Promise.all([
    prisma.show.findUnique({ where: { id: showId } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])
  if (!show) notFound()
  if (!user || !canManageShow(user, show)) redirect('/')
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
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>#</th>
              <th className={tableCellClass}>Title</th>
              <th className={tableCellClass}>Artist</th>
              <th className={tableCellClass}>Album</th>
              <th className={tableCellClass}>Label</th>
              <th className={tableCellClass}>Played</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => (
              <tr key={track.id} className="border-b border-stone-800">
                <td className={tableCellClass}>{track.indexNumber ?? i + 1}</td>
                <td className={tableCellClass}>{track.songTitle}</td>
                <td className={tableCellClass}>{track.artist}</td>
                <td className={tableCellClass}>{track.album}</td>
                <td className={tableCellClass}>{track.label}</td>
                <td className={tableCellClass}>
                  {track.playDate ? prettifySimpleTime(track.playDate) : '-'}
                </td>
                <td className={tableCellClass}>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/edit-track/${track.id}`} className={cn(btnXsPrimary, 'no-underline')}>
                      Edit
                    </Link>
                    <DeleteTrackButton trackId={track.id} songTitle={track.songTitle} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
