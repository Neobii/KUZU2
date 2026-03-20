import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AddTrackForm } from './AddTrackForm'

export default async function AddTrackToShowPage({
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

  return (
    <div>
      <h2>Add Track to {show.showName}</h2>
      <p><Link href={`/show/${showId}/tracks`}>Back to Show</Link></p>
      <AddTrackForm showId={showId} />
    </div>
  )
}
