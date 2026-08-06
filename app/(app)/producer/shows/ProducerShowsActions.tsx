'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { btnXsDanger, btnXsSecondary, btnXsSuccess, btnXsWarning, inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function ProducerShowsActions({
  showId,
  showName,
  isActive,
}: {
  showId: string
  showName: string
  isActive: boolean
}) {
  const router = useRouter()
  const [dupName, setDupName] = useState(`${showName} (copy)`)

  async function activate() {
    await fetch(`/api/shows/${showId}/activate`, { method: 'POST' })
    router.push('/live-show')
    router.refresh()
  }

  async function remove() {
    if (!window.confirm('Delete this show?')) return
    const res = await fetch(`/api/shows/${showId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    }
  }

  async function deactivate() {
    if (!window.confirm('Stop this show?')) return
    await fetch(`/api/shows/${showId}/deactivate`, { method: 'POST' })
    router.refresh()
  }

  async function duplicate() {
    const res = await fetch(`/api/shows/${showId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showName: dupName }),
    })
    if (res.ok) {
      const s = await res.json()
      router.push(`/show/${s.id}/tracks`)
      router.refresh()
    }
  }

  return (
    <span className="ml-2 inline-flex flex-wrap items-center gap-2">
      {isActive ? (
        <button type="button" className={btnXsWarning} onClick={() => void deactivate()}>
          Stop Show
        </button>
      ) : (
        <button type="button" className={btnXsSuccess} onClick={() => void activate()}>
          Go Live
        </button>
      )}
      <button type="button" className={btnXsSecondary} onClick={() => void duplicate()}>
        Duplicate
      </button>
      <button type="button" className={btnXsDanger} onClick={() => void remove()}>
        Delete
      </button>
      <input
        type="text"
        className={cn(inputClass, 'inline-block max-w-[10rem] text-xs')}
        value={dupName}
        onChange={(e) => setDupName(e.target.value)}
        placeholder="Duplicate name"
      />
    </span>
  )
}
