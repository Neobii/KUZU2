import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageShow } from '@/lib/show-access'
import { EditTrackForm } from './EditTrackForm'

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { trackId } = await params
  const track = await prisma.tracklist.findUnique({
    where: { id: trackId },
    include: { show: true },
  })
  if (!track) notFound()
  if (!track.showId || !track.show) redirect('/')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !canManageShow(user, track.show)) redirect('/')
  return (
    <div>
      <h2>Edit Track</h2>
      <EditTrackForm track={JSON.parse(JSON.stringify(track))} />
    </div>
  )
}
