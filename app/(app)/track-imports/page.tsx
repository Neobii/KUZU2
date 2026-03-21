'use client'

import { useEffect, useState } from 'react'
import { TrackImportsClient } from '@/components/TrackImportsClient'

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
      <h2>Track Imports</h2>
      <div className="form-group">
        <label>Show</label>
        <select
          className="form-control"
          style={{ maxWidth: 400 }}
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
      {sid ? <TrackImportsClient showId={sid} /> : <p>Choose a show to import tracks into.</p>}
    </div>
  )
}
