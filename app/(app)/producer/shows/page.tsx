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
import { showsListWhereForUser } from '@/lib/show-access'
import { ProducerShowsActions } from './ProducerShowsActions'

export default async function ProducerShowsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = (session.user as { id?: string }).id
  const listFlags = {
    isAdmin: session.user.isAdmin === true,
    isBoardMember: session.user.isBoardMember === true,
    isFieldProducer: session.user.isFieldProducer === true,
  }
  const shows = await prisma.show.findMany({
    where: showsListWhereForUser(userId, listFlags),
    orderBy: { showStart: 'desc' },
  })

  const createAction = (
    <Link href="/start-show" className={cn(btnPrimary, 'no-underline')}>
      Create New Show
    </Link>
  )

  return (
    <div>
      <PageHeader
        title="My Shows"
        description="Shows you own or help on. Board and field producers see every show."
        action={createAction}
      />
      <StackedList
        emptyMessage="No shows yet. Create one, or ask an admin to add you as a helper."
        emptyAction={createAction}
      >
        {shows.map((show) => {
          const isHelperOnly = !!userId && show.helperUserId === userId && show.userId !== userId
          const metaParts = [
            show.showStart ? prettifySimpleTime(show.showStart) : null,
            show.episodeNumber != null ? `Episode ${show.episodeNumber}` : null,
            isHelperOnly ? 'Helper' : null,
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
