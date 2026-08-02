import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ArtistsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const isAdmin = !!session?.user?.isAdmin
  const isManagingArtists = !!session?.user?.isManagingArtists
  if (!isAdmin && !isManagingArtists) {
    redirect('/')
  }
  return (
    <div>
      <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-amber-400">
        <Link href="/artists" className="no-underline hover:text-amber-300">
          Artists
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
