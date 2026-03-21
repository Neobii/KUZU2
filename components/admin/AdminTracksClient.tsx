'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import { btnXsPrimary, formGroupClass, inputClass, tableClass, tableCellClass, tableHeadClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

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
      <div className={formGroupClass}>
        <input
          className={cn(inputClass, 'max-w-md')}
          placeholder="Search title, artist, album, label…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Title</th>
              <th className={tableCellClass}>Artist</th>
              <th className={tableCellClass}>Show</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {tracks?.map((t) => (
              <tr key={t.id}>
                <td className={tableCellClass}>{t.songTitle}</td>
                <td className={tableCellClass}>{t.artist}</td>
                <td className={tableCellClass}>{t.show?.showName ?? '—'}</td>
                <td className={tableCellClass}>
                  <Link href={`/edit-track/${t.id}`} className={cn(btnXsPrimary, 'no-underline')}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
