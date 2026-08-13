'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { btnXsDanger } from '@/lib/ui'

type Props = {
  trackId: string
  songTitle: string
}

export function DeleteTrackButton({ trackId, songTitle }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    const label = songTitle.trim() || 'this track'
    if (!window.confirm(`Delete "${label}" from this show?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        window.alert(typeof body.error === 'string' ? body.error : 'Could not delete track.')
        return
      }
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      className={btnXsDanger}
      disabled={deleting}
      onClick={() => void onDelete()}
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}
