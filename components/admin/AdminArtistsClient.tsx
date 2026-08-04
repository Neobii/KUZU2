'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useState } from 'react'
import {
  btnPrimary,
  btnSecondary,
  btnXsDanger,
  btnXsPrimary,
  formGroupClass,
  inputClassLight,
  labelClassLight,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ArtistRow = {
  id: string
  artistName: string
  imageUrl: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
  _count: { tracks: number }
}

type ArtistValues = { artistName: string; imageUrl: string; bio: string }

export function AdminArtistsClient() {
  const { data, mutate } = useSWR<{ artists?: ArtistRow[] }>('/api/admin/artists', fetcher)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ArtistRow | null>(null)

  async function save(v: ArtistValues, id?: string) {
    const body: Record<string, string> = { artistName: v.artistName }
    if (v.imageUrl.trim() !== '') body.imageUrl = v.imageUrl.trim()
    else if (id) body.imageUrl = ''
    if (v.bio.trim() !== '') body.bio = v.bio.trim()
    else if (id) body.bio = ''
    const res = await fetch(id ? `/api/admin/artists/${id}` : '/api/admin/artists', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setCreating(false)
      setEditing(null)
      void mutate()
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete artist?')) return
    await fetch(`/api/admin/artists/${id}`, { method: 'DELETE' })
    void mutate()
  }

  const artists = data?.artists ?? []

  return (
    <div>
      <p className="mb-4">
        <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
          Add artist
        </button>
      </p>
      {creating && (
        <ArtistForm
          title="Add artist"
          initial={{ artistName: '', imageUrl: '', bio: '' }}
          onSave={(v) => void save(v)}
          onCancel={() => setCreating(false)}
        />
      )}
      {editing && (
        <ArtistForm
          title={`Edit ${editing.artistName}`}
          initial={{
            artistName: editing.artistName,
            imageUrl: editing.imageUrl ?? '',
            bio: editing.bio ?? '',
          }}
          onSave={(v) => void save(v, editing.id)}
          onCancel={() => setEditing(null)}
        />
      )}
      <div className="overflow-x-auto">
        <table className={cn(tableClass, 'text-stone-300')}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Artist</th>
              <th className={tableCellClass}>Image</th>
              <th className={tableCellClass}>Bio</th>
              <th className={tableCellClass}>Tracks</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id}>
                <td className={tableCellClass}>{a.artistName}</td>
                <td className={tableCellClass}>
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td className={tableCellClass}>{a.bio || '—'}</td>
                <td className={tableCellClass}>
                  {(a._count?.tracks ?? 0) > 0 ? (
                    <Link href={`/artists/${a.id}/tracks`} className="text-amber-400 no-underline hover:text-amber-300">
                      {a._count.tracks}
                    </Link>
                  ) : (
                    0
                  )}
                </td>
                <td className={tableCellClass}>
                  <button type="button" className={btnXsPrimary} onClick={() => setEditing(a)}>
                    Edit
                  </button>{' '}
                  <button type="button" className={btnXsDanger} onClick={() => void remove(a.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ArtistForm({
  title,
  initial,
  onSave,
  onCancel,
}: {
  title: string
  initial: ArtistValues
  onSave: (v: ArtistValues) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)

  return (
    <div className="mb-6 rounded-lg border border-stone-600 bg-white p-4 text-stone-900 shadow-lg">
      <div className="mb-4 border-b border-stone-200 pb-2 text-lg font-semibold">{title}</div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Artist name</label>
        <input
          className={inputClassLight}
          value={v.artistName}
          onChange={(e) => setV({ ...v, artistName: e.target.value })}
          required
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Image URL</label>
        <input
          className={inputClassLight}
          value={v.imageUrl}
          onChange={(e) => setV({ ...v, imageUrl: e.target.value })}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Bio</label>
        <textarea
          className={inputClassLight}
          rows={3}
          value={v.bio}
          onChange={(e) => setV({ ...v, bio: e.target.value })}
        />
      </div>
      <button type="button" className={btnPrimary} onClick={() => onSave(v)}>
        Save
      </button>{' '}
      <button type="button" className={cn(btnSecondary, 'ml-2')} onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
