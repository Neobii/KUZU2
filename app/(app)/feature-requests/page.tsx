import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { FeatureRequestsClient } from '@/components/FeatureRequestsClient'

export default async function FeatureRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const u = session.user as { isAdmin?: boolean; producerProfile?: { isPioneer?: boolean } }
  if (!u.isAdmin && !u.producerProfile?.isPioneer) redirect('/')
  return <FeatureRequestsClient />
}
