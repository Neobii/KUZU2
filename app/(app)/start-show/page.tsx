'use client'

import { useRouter } from 'next/navigation'

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
      <h2>Start a new show</h2>
      <p>This creates a show from your program defaults.</p>
      <button type="button" className="btn btn-primary btn-lg" onClick={() => void createShow()}>
        Create Show
      </button>
    </div>
  )
}
