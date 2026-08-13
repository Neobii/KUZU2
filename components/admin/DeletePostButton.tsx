'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { btnXsDanger } from '@/lib/ui'

type Props = {
  postId: string
  title: string
}

export function DeletePostButton({ postId, title }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    const label = title.trim() || 'this update'
    if (!window.confirm(`Delete "${label}"?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        window.alert(typeof body.error === 'string' ? body.error : 'Could not delete post.')
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
