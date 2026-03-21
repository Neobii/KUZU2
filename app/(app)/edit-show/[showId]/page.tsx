import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditShowForm } from './EditShowForm'

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ showId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { showId } = await params
  const show = await prisma.show.findUnique({ where: { id: showId } })
  if (!show) notFound()
  return (
    <div>
      <h2>Edit Show</h2>
      <EditShowForm show={JSON.parse(JSON.stringify(show))} />
    </div>
  )
}
