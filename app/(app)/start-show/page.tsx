'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { btnPrimaryLg, btnSecondary } from '@/lib/ui'

export default function StartShowPage() {
  const router = useRouter()

  async function createShow() {
    const res = await fetch('/api/shows/create', { method: 'POST' })
    if (res.ok) {
      const show = await res.json()
      router.push(`/show/${show.id}/tracks`)
      router.refresh()
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-stone-100">Start a new show</h2>
      <p className="mb-4 text-stone-400">This creates a show from your program defaults.</p>
      <div className="flex items-center gap-3">
        <button type="button" className={btnPrimaryLg} onClick={() => void createShow()}>
          Create Show
        </button>
        <Link href="/producer/shows" className={btnSecondary}>
          Cancel
        </Link>
      </div>
    </div>
  )
}
