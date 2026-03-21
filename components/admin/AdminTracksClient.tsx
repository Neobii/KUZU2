'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Track = {
  id: string
  songTitle: string
  artist: string | null
  show: { id: string; showName: string } | null
}

export function AdminTracksClient() {
  const [q, setQ] = useState('')
  const { data: tracks } = useSWR<Track[]>(
    `/api/admin/tracks?search=${encodeURIComponent(q)}&take=150`,
    fetcher
  )

  return (
    <div>
      <div className="form-group">
        <input
          className="form-control"
          placeholder="Search title, artist, album, label…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Artist</th>
            <th>Show</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tracks?.map((t) => (
            <tr key={t.id}>
              <td>{t.songTitle}</td>
              <td>{t.artist}</td>
              <td>{t.show?.showName ?? '—'}</td>
              <td>
                <Link href={`/edit-track/${t.id}`} className="btn btn-xs btn-primary">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
