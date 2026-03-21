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
      <h2>My Shows</h2>
      <p><Link href="/start-show">Create New Show</Link></p>
      <ul>
        {shows.map((show) => (
          <li key={show.id}>
            <Link href={`/show/${show.id}/tracks`}>{show.showName}</Link>
            {show.showStart && (
              <span> — {prettifySimpleTime(show.showStart)}</span>
            )}
            <ProducerShowsActions showId={show.id} showName={show.showName} />
          </li>
        ))}
      </ul>
    </div>
  )
}
