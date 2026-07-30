'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, useMemo, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { btnPrimary, inputClass } from '@/lib/ui'

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function LoginForm({ facebookAuthEnabled }: { facebookAuthEnabled: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const signupFromUrl = searchParams.get('signup') === '1'
  const resetSuccess = searchParams.get('reset') === '1'

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

  const tabBtn = (active: boolean) =>
    cn(
      'flex-1 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
      active
        ? 'border-amber-600 bg-stone-800 text-white'
        : 'border-stone-600 bg-stone-900 text-stone-300 hover:bg-stone-800'
    )

  return (
    <div className="mx-auto mt-16 max-w-md px-5 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-white">KUZU</h1>
      <p className="mb-5 text-stone-400">{heading}</p>

      {resetSuccess && (
        <p className="mb-4 rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          Password updated. Sign in with your new password.
        </p>
      )}

      {facebookAuthEnabled && (
        <>
          <button
            type="button"
            onClick={handleFacebook}
            disabled={oauthLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-md bg-[#1877F2] px-4 py-3 text-base font-semibold text-white hover:bg-[#166fe5] disabled:cursor-wait disabled:opacity-80"
            aria-label="Continue with Facebook"
          >
            <FacebookIcon />
            {oauthLoading ? 'Redirecting…' : 'Continue with Facebook'}
          </button>
          <p className="my-4 text-center text-sm text-stone-500">
            New or existing account — we&apos;ll sign you in
          </p>
        </>
      )}

      <div role="tablist" aria-label="Sign in or create account" className="mb-4 flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => {
            setMode('signin')
            setError('')
          }}
          className={tabBtn(mode === 'signin')}
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
          className={tabBtn(mode === 'signup')}
        >
          Sign up
        </button>
      </div>

      {mode === 'signin' ? (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={inputClass}
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-amber-400 hover:text-amber-300">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitLoading} className={cn(btnPrimary, 'w-full py-2.5')}>
            {submitLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitLoading} className={cn(btnPrimary, 'w-full py-2.5')}>
            {submitLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
