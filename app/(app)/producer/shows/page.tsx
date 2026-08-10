import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifySimpleTime } from '@/lib/utils'
import { btnPrimary } from '@/lib/ui'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/ui/PageHeader'
import { StackedList, StackedListItem } from '@/components/ui/StackedList'
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

  const createAction = (
    <Link href="/start-show" className={cn(btnPrimary, 'no-underline')}>
      Create New Show
    </Link>
  )

  return (
    <div>
      <PageHeader title="My Shows" action={createAction} />
      <StackedList
        emptyMessage="No shows yet. Create one to get started."
        emptyAction={createAction}
      >
        {shows.map((show) => {
          const metaParts = [
            show.showStart ? prettifySimpleTime(show.showStart) : null,
            show.episodeNumber != null ? `Episode ${show.episodeNumber}` : null,
            show.isActive ? 'Live' : null,
          ].filter(Boolean)

          return (
            <StackedListItem
              key={show.id}
              title={show.showName?.trim() || 'Kuzu Show'}
              href={`/show/${show.id}/tracks`}
              meta={metaParts.length ? metaParts.join(' · ') : undefined}
              actions={
                <ProducerShowsActions
                  showId={show.id}
                  showName={show.showName}
                  isActive={show.isActive === true}
                />
              }
            />
          )
        })}
      </StackedList>
    </div>
  )
}
