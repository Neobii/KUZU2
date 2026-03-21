import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessProducerPortal } from '@/lib/can-access-producer-portal'

export default async function TrackImportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!canAccessProducerPortal(session.user)) {
    redirect('/')
  }
  return <>{children}</>
}
