import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function StartShowPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <h2>Start Show</h2>
}
