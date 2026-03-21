import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ProgramInformationForm } from '@/components/ProgramInformationForm'

export default async function ProducerProgramPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return (
    <div>
      <h2>My Program Information</h2>
      <ProgramInformationForm />
    </div>
  )
}
