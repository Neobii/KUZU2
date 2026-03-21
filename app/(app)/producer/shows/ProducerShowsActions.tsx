'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { btnXsSecondary, btnXsSuccess, inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function ProducerShowsActions({
  showId,
  showName,
}: {
  showId: string
  showName: string
}) {
  const router = useRouter()
  const [dupName, setDupName] = useState(`${showName} (copy)`)

  async function activate() {
    await fetch(`/api/shows/${showId}/activate`, { method: 'POST' })
    router.push('/live-show')
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
      <button type="button" className={btnXsSuccess} onClick={() => void activate()}>
        Go live
      </button>
      <button type="button" className={btnXsSecondary} onClick={() => void duplicate()}>
        Duplicate
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
