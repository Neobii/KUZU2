import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminProducersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!session.user.isAdmin) redirect('/')
  return <h2>Admin Producers</h2>
}
