'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { prettifyDate, prettifySimpleTime } from '@/lib/utils-client'
import moment from 'moment'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Show = {
  id: string
  showName: string
  showStart: string | null
  showEnd: string | null
  isActive: boolean | null
  defaultMeta: string | null
  autoStartEnd: boolean
}

export function AdminShowsClient() {
  const { data: shows, mutate } = useSWR<Show[]>('/api/shows', fetcher)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!shows) return []
    if (!q.trim()) return shows
    const s = q.toLowerCase()
    return shows.filter((x) => x.showName.toLowerCase().includes(s))
  }, [shows, q])

  async function activate(id: string) {
    await fetch(`/api/shows/${id}/activate`, { method: 'POST' })
    void mutate()
  }

  async function deactivate(id: string) {
    await fetch(`/api/shows/${id}/deactivate`, { method: 'POST' })
    void mutate()
  }

  async function remove(id: string) {
    if (!confirm('Delete show and related messages links?')) return
    await fetch(`/api/shows/${id}`, { method: 'DELETE' })
    void mutate()
  }

  return (
    <div>
      <div className="form-group">
        <input
          className="form-control"
          placeholder="Search shows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>
      {filtered.map((show) => {
        const endAfter = show.showEnd && moment(show.showEnd).add(10, 'minutes').isAfter(moment())
        return (
          <div key={show.id} className="form-holder" style={{ marginBottom: 16 }}>
            <h3>
              {show.showName}
              <br />
              <span className="small">
                {show.showStart ? prettifyDate(show.showStart) : ''},{' '}
                {show.showStart ? prettifySimpleTime(show.showStart) : ''} –{' '}
                {show.showEnd ? prettifySimpleTime(show.showEnd) : ''}
              </span>
            </h3>
            <p>
              <Link href={`/show/${show.id}/tracks`} className="btn btn-sm btn-default">
                Tracks
              </Link>{' '}
              <a
                href={`/api/export/shows/${show.id}/tracks`}
                className="btn btn-sm btn-default"
                download
              >
                Export TSV
              </a>{' '}
              {show.isActive ? (
                <button type="button" className="btn btn-sm btn-warning" onClick={() => void deactivate(show.id)}>
                  Stop show
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => void activate(show.id)}>
                  Start show
                </button>
              )}{' '}
              {!show.autoStartEnd && endAfter && (
                <span className="text-muted">(auto start/end off)</span>
              )}{' '}
              <Link href={`/edit-show/${show.id}`} className="btn btn-sm btn-primary">
                Edit
              </Link>{' '}
              <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(show.id)}>
                Delete
              </button>
            </p>
            {show.defaultMeta && <small>{show.defaultMeta}</small>}
            <hr />
          </div>
        )
      })}
    </div>
  )
}
