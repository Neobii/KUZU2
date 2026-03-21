import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessLiveShow } from '@/lib/api-auth'
import { LiveShow } from '@/components/LiveShow'

export default async function LiveShowPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = (session.user as { id?: string }).id
  if (!userId) redirect('/login')
  const ok = await canAccessLiveShow(userId)
  if (!ok) redirect('/')
  return <LiveShow />
}
