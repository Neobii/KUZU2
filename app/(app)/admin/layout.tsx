import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    redirect('/')
  }
  return (
    <div>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/admin/users">Users</Link>
        {' · '}
        <Link href="/admin/shows">Shows</Link>
        {' · '}
        <Link href="/admin/tracks">Tracks</Link>
        {' · '}
        <Link href="/admin/producers">Producers</Link>
        {' · '}
        <Link href="/admin/production-statuses">Statuses</Link>
        {' · '}
        <Link href="/admin/auto-dj-playlists">Auto DJ</Link>
        {' · '}
        <Link href="/admin/posts">Posts</Link>
        {' · '}
        <Link href="/">Home</Link>
      </nav>
      {children}
    </div>
  )
}
