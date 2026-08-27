import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canCreateShows } from '@/lib/show-access'

export default async function StartShowLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (
    !canCreateShows({
      isAdmin: session.user.isAdmin === true,
      isBoardMember: session.user.isBoardMember === true,
      isFieldProducer: session.user.isFieldProducer === true,
      isProducer: session.user.isProducer === true,
      producerProfile: session.user.producerProfile ?? null,
    })
  ) {
    redirect('/')
  }
  return <>{children}</>
}
