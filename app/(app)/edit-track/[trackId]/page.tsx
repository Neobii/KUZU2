import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditTrackForm } from './EditTrackForm'

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { trackId } = await params
  const track = await prisma.tracklist.findUnique({ where: { id: trackId } })
  if (!track) notFound()
  return (
    <div>
      <h2>Edit Track</h2>
      <EditTrackForm track={JSON.parse(JSON.stringify(track))} />
    </div>
  )
}
