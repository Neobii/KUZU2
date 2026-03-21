import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ProducerProfileForm } from '@/components/ProducerProfileForm'

export default async function ProducerProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return (
    <div>
      <h2>My Producer Profile</h2>
      <ProducerProfileForm />
    </div>
  )
}
