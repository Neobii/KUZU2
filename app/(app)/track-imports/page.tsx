'use client'

import { useEffect, useState } from 'react'
import { TrackImportsClient } from '@/components/TrackImportsClient'
import { formGroupClass, inputClass, labelClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export default function TrackImportsPage() {
  const [shows, setShows] = useState<{ id: string; showName: string }[]>([])
  const [sid, setSid] = useState('')

  useEffect(() => {
    void fetch('/api/shows')
      .then((r) => r.json())
      .then(setShows)
  }, [])

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-stone-100">Track Imports</h2>
      <div className={formGroupClass}>
        <label className={labelClass}>Show</label>
        <select
          className={cn(inputClass, 'max-w-md')}
          value={sid}
          onChange={(e) => setSid(e.target.value)}
        >
          <option value="">Select a show…</option>
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.showName}
            </option>
          ))}
        </select>
      </div>
      {sid ? (
        <TrackImportsClient showId={sid} />
      ) : (
        <p className="text-stone-400">Choose a show to import tracks into.</p>
      )}
    </div>
  )
}
