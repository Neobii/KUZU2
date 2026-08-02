import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminArtistsClient } from '@/components/admin/AdminArtistsClient'

export default async function AdminArtistsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (!session.user.isAdmin && !session.user.isManagingArtists)) {
    // Spec asked for redirect('/admin'), but no app/(app)/admin/page.tsx exists (404);
    // mirror the admin layout's convention of redirecting to '/'.
    redirect('/')
  }
  return (
    <div>
      <h2>Artists</h2>
      <AdminArtistsClient />
    </div>
  )
}
