import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions, isFacebookAuthEnabled } from '@/lib/auth'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/')

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <LoginForm facebookAuthEnabled={isFacebookAuthEnabled} />
    </Suspense>
  )
}
