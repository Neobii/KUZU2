import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifySimpleTime } from '@/lib/utils'
import { ProducerShowsActions } from './ProducerShowsActions'

export default async function ProducerShowsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = (session.user as { id?: string }).id
  const isAdmin = session.user.isAdmin
  const where = isAdmin ? {} : { userId }
  const shows = await prisma.show.findMany({
    where,
    orderBy: { showStart: 'desc' },
  })

  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold text-stone-100">My Shows</h2>
      <p className="mb-4">
        <Link href="/start-show" className="no-underline">
          Create New Show
        </Link>
      </p>
      <ul className="list-inside list-disc space-y-3 text-stone-300">
        {shows.map((show) => (
          <li key={show.id}>
            <Link href={`/show/${show.id}/tracks`}>
              {show.showName?.trim() || 'Kuzu Show'}
            </Link>
            {show.showStart && (
              <span> — {prettifySimpleTime(show.showStart)}</span>
            )}
            {show.episodeNumber != null && <span> · Episode {show.episodeNumber}</span>}
            <ProducerShowsActions
              showId={show.id}
              showName={show.showName}
              isActive={show.isActive === true}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
