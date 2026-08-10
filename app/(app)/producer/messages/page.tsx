import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ProducerMessagesClient } from '@/components/producer/ProducerMessagesClient'

export default async function ProducerMessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const producerProfile = session.user.producerProfile as { isMessagingUIEnabled?: boolean } | undefined
  if (!session.user.isAdmin && !producerProfile?.isMessagingUIEnabled) {
    redirect('/producer/shows')
  }

  return (
    <div>
      <h2>Messages</h2>
      <ProducerMessagesClient />
    </div>
  )
}
