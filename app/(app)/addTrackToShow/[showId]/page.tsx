import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageShow } from '@/lib/show-access'
import { AddTrackForm } from './AddTrackForm'

export default async function AddTrackToShowPage({
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

  return (
    <div>
      <h2>Add Track to {show.showName}</h2>
      <p><Link href={`/show/${showId}/tracks`}>Back to Show</Link></p>
      <AddTrackForm showId={showId} />
    </div>
  )
}
