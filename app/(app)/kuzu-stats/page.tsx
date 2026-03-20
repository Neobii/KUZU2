import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function KuzuStatsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <h2>Kuzu Stats</h2>
}
