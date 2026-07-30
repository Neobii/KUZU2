'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { cn } from '@/lib/cn'
import { btnPrimary, btnLink, inputClass } from '@/lib/ui'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send reset link')
        return
      }

      setSubmitted(true)
      setMessage(
        typeof data.message === 'string'
          ? data.message
          : 'If an account with that email exists, we sent a password reset link.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-5 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-white">KUZU</h1>
      <p className="mb-5 text-stone-400">Forgot password</p>

      {submitted ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-stone-300">{message}</p>
          <p className="text-sm text-stone-500">
            Check your inbox and spam folder. The link expires in 1 hour.
          </p>
          <Link href="/login" className={cn(btnLink, 'self-start px-0')}>
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-stone-400">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className={cn(btnPrimary, 'w-full py-2.5')}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <Link href="/login" className={cn(btnLink, 'self-start px-0')}>
            ← Back to sign in
          </Link>
        </form>
      )}
    </div>
  )
}
