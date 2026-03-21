'use client'

import { signIn } from 'next-auth/react'
import { useState, useMemo, type CSSProperties, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '10px 12px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  background: active ? '#f5f5f5' : '#fff',
  fontWeight: active ? 600 : 400,
  borderRadius: 6,
})

export function LoginForm({ facebookAuthEnabled }: { facebookAuthEnabled: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const signupFromUrl = searchParams.get('signup') === '1'

  const [mode, setMode] = useState<'signin' | 'signup'>(() => (signupFromUrl ? 'signup' : 'signin'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [oauthLoading, setOauthLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const heading = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Create account'), [mode])

  async function handleFacebook() {
    setError('')
    setOauthLoading(true)
    try {
      await signIn('facebook', { callbackUrl })
    } finally {
      setOauthLoading(false)
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitLoading(true)
    try {
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
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not create account')
        return
      }
      const signRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (signRes?.error) {
        setError('Account created. Please sign in.')
        setMode('signin')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>KUZU</h1>
      <p style={{ marginTop: 0, marginBottom: 20, color: '#666' }}>{heading}</p>

      {facebookAuthEnabled && (
        <>
          <button
            type="button"
            onClick={handleFacebook}
            disabled={oauthLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              cursor: oauthLoading ? 'wait' : 'pointer',
              background: '#1877F2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
            aria-label="Continue with Facebook"
          >
            <FacebookIcon />
            {oauthLoading ? 'Redirecting…' : 'Continue with Facebook'}
          </button>
          <p style={{ textAlign: 'center', margin: '16px 0', color: '#888' }}>
            New or existing account — we&apos;ll sign you in
          </p>
        </>
      )}

      <div
        role="tablist"
        aria-label="Sign in or create account"
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => {
            setMode('signin')
            setError('')
          }}
          style={tabStyle(mode === 'signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => {
            setMode('signup')
            setError('')
          }}
          style={tabStyle(mode === 'signup')}
        >
          Sign up
        </button>
      </div>

      {mode === 'signin' ? (
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ padding: 10, color: '#000' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ padding: 10, color: '#000' }}
          />
          {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
          <button type="submit" disabled={submitLoading} style={{ padding: 12, cursor: 'pointer' }}>
            {submitLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ padding: 10, color: '#000' }}
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ padding: 10, color: '#000' }}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ padding: 10, color: '#000' }}
          />
          {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
          <button type="submit" disabled={submitLoading} style={{ padding: 12, cursor: 'pointer' }}>
            {submitLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
