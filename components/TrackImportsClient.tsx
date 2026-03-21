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
      <h3 className="mb-2 text-lg font-medium text-stone-200">Track import (Reaper / CSV)</h3>
      <p className="mb-3 text-sm text-stone-400">
        Upload a CSV with columns: Name, Meta, Album, Label, Length (Reaper export).
      </p>
      <input
        type="file"
        accept=".csv"
        className="text-sm text-stone-300 file:mr-3 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-amber-700"
        onChange={onFile}
      />
      <p className="mt-2 text-sm text-stone-400">{status}</p>
    </div>
  )
}
