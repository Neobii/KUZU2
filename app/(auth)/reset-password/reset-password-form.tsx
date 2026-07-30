'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { btnPrimary, btnLink, inputClass } from '@/lib/ui'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing reset token. Request a new link from the forgot password page.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not reset password')
        return
      }

      router.push('/login?reset=1')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-5 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-white">KUZU</h1>
      <p className="mb-5 text-stone-400">Set a new password</p>

      {!token ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-400">
            This reset link is invalid. Request a new one below.
          </p>
          <Link href="/forgot-password" className={cn(btnPrimary, 'w-full py-2.5 text-center')}>
            Request reset link
          </Link>
          <Link href="/login" className={cn(btnLink, 'self-start px-0')}>
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className={cn(btnPrimary, 'w-full py-2.5')}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
          <Link href="/login" className={cn(btnLink, 'self-start px-0')}>
            ← Back to sign in
          </Link>
        </form>
      )}
    </div>
  )
}
