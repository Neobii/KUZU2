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
      <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-amber-400">
        <Link href="/admin/users" className="no-underline hover:text-amber-300">
          Users
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/shows" className="no-underline hover:text-amber-300">
          Shows
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/tracks" className="no-underline hover:text-amber-300">
          Tracks
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/producers" className="no-underline hover:text-amber-300">
          Producers
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/production-statuses" className="no-underline hover:text-amber-300">
          Statuses
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/auto-dj-playlists" className="no-underline hover:text-amber-300">
          Auto DJ
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/live-chat" className="no-underline hover:text-amber-300">
          Live Chat
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/admin/posts" className="no-underline hover:text-amber-300">
          Posts
        </Link>
        <span className="text-stone-600">·</span>
        <Link href="/" className="no-underline hover:text-amber-300">
          Home
        </Link>
      </nav>
      {children}
    </div>
  )
}
