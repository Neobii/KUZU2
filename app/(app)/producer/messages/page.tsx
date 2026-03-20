import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ProducerMessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <h2>My Messages</h2>
}
