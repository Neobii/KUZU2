import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'

export default async function TrackListsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return (
    <div>
      <h2>Track Lists</h2>
      <p>
        <Link href="/track-imports">Import tracks from Reaper CSV</Link>
      </p>
      <p>Use producer shows to open a show and manage its track list.</p>
    </div>
  )
}
