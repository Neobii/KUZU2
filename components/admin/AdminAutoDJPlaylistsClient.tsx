'use client'

import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Playlist = {
  id: string
  name: string
  showSchedules: { startTime: string; endTime: string; weekday: string }[] | null
}

export function AdminAutoDJPlaylistsClient() {
  const { data: rows, mutate } = useSWR<Playlist[]>('/api/admin/auto-dj-playlists', fetcher)
  const [editing, setEditing] = useState<Playlist | null>(null)
  const [creating, setCreating] = useState(false)

  async function save(p: { id?: string; name: string; showSchedules: unknown }) {
    const url = p.id ? `/api/admin/auto-dj-playlists/${p.id}` : '/api/admin/auto-dj-playlists'
    const method = p.id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p.name,
        showSchedules: p.showSchedules,
      }),
    })
    if (res.ok) {
      setEditing(null)
      setCreating(false)
      void mutate()
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete?')) return
    await fetch(`/api/admin/auto-dj-playlists/${id}`, { method: 'DELETE' })
    void mutate()
  }

  return (
    <div>
      <p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          New playlist
        </button>
      </p>
      {(creating || editing) && (
        <PlaylistForm
          initial={creating ? null : editing}
          onSave={(x) => void save(x)}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
      <ul>
        {rows?.map((r) => (
          <li key={r.id}>
            <strong>{r.name}</strong>{' '}
            <button type="button" className="btn btn-xs btn-primary" onClick={() => setEditing(r)}>
              Edit
            </button>{' '}
            <button type="button" className="btn btn-xs btn-danger" onClick={() => void remove(r.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlaylistForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Playlist | null
  onSave: (p: { id?: string; name: string; showSchedules: unknown }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [schedulesJson, setSchedulesJson] = useState(
    JSON.stringify(initial?.showSchedules ?? [], null, 2)
  )

  return (
    <div className="panel panel-default" style={{ marginBottom: 24 }}>
      <div className="panel-body" style={{ color: '#333' }}>
        <div className="form-group">
          <label>Name</label>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>
            Show schedules (JSON array of {'{'} startTime, endTime, weekday {'}'})
          </label>
          <textarea
            className="form-control"
            rows={10}
            value={schedulesJson}
            onChange={(e) => setSchedulesJson(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            let showSchedules: unknown = []
            try {
              showSchedules = JSON.parse(schedulesJson)
            } catch {
              alert('Invalid JSON')
              return
            }
            onSave({
              id: initial?.id,
              name,
              showSchedules,
            })
          }}
        >
          Save
        </button>{' '}
        <button type="button" className="btn btn-default" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
