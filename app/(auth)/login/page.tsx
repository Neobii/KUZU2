'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (res?.error) {
      setError('Invalid email or password')
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1>KUZU Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, color: '#000' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, color: '#000' }}
        />
        {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
        <button type="submit" style={{ padding: 12, cursor: 'pointer' }}>
          Sign In
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
