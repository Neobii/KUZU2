'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

export function TrackImportsClient({ showId }: { showId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[]
        const res = await fetch('/api/import/reaper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showId, data }),
        })
        setStatus(res.ok ? 'Import complete.' : 'Import failed.')
        if (res.ok) router.push(`/show/${showId}/tracks`)
      },
      error: () => setStatus('Parse error'),
    })
  }

  return (
    <div>
      <h2>Track import (Reaper / CSV)</h2>
      <p>Upload a CSV with columns: Name, Meta, Album, Label, Length (Reaper export).</p>
      <input type="file" accept=".csv" onChange={onFile} />
      <p>{status}</p>
    </div>
  )
}
