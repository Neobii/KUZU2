import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminAutoDJPlaylistsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!session.user.isAdmin) redirect('/')
  return <h2>Admin Auto DJ Playlists</h2>
}
