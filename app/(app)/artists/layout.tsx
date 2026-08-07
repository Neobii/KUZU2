import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ArtistsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const isAdmin = !!session?.user?.isAdmin
  const isManagingArtists = !!session?.user?.isManagingArtists
  if (!isAdmin && !isManagingArtists) {
    redirect('/')
  }
  return children
}
