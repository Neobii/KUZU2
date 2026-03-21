import { Suspense } from 'react'
import { isFacebookAuthEnabled } from '@/lib/auth'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <LoginForm facebookAuthEnabled={isFacebookAuthEnabled} />
    </Suspense>
  )
}
