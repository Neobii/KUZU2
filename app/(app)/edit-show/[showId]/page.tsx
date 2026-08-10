import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageShow } from '@/lib/show-access'
import { EditShowForm } from './EditShowForm'

export default async function EditShowPage({
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
      <h2>Edit Show</h2>
      <EditShowForm show={JSON.parse(JSON.stringify(show))} />
    </div>
  )
}
