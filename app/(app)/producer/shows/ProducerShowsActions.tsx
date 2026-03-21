'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
    <span style={{ marginLeft: 8 }}>
      <button type="button" className="btn btn-xs btn-success" onClick={() => void activate()}>
        Go live
      </button>{' '}
      <button type="button" className="btn btn-xs btn-default" onClick={() => void duplicate()}>
        Duplicate
      </button>
      <input
        type="text"
        className="form-control input-sm"
        style={{ display: 'inline-block', width: 160, marginLeft: 8 }}
        value={dupName}
        onChange={(e) => setDupName(e.target.value)}
        placeholder="Duplicate name"
      />
    </span>
  )
}
