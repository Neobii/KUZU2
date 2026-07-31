'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { prettifyDate, prettifySimpleTime } from '@/lib/utils-client'
import moment from 'moment'
import {
  btnSmDanger,
  btnSmPrimary,
  btnSmSecondary,
  btnSmWarning,
  formGroupClass,
  inputClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Show = {
  id: string
  showName: string
  showStart: string | null
  showEnd: string | null
  isActive: boolean | null
  defaultMeta: string | null
  autoStartEnd: boolean
  episodeNumber: number | null
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
      <div className={formGroupClass}>
        <input
          className={cn(inputClass, 'max-w-md')}
          placeholder="Search shows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {filtered.map((show) => {
        const endAfter = show.showEnd && moment(show.showEnd).add(10, 'minutes').isAfter(moment())
        return (
          <div key={show.id} className="form-holder mb-4">
            <h3 className="text-lg font-semibold text-stone-100">
              {show.showName}
              <br />
              <span className="text-sm font-normal text-stone-400">
                {show.showStart ? prettifyDate(show.showStart) : ''},{' '}
                {show.showStart ? prettifySimpleTime(show.showStart) : ''} –{' '}
                {show.showEnd ? prettifySimpleTime(show.showEnd) : ''}
              </span>
            </h3>
            <p className="mt-2 flex flex-wrap gap-2">
              <Link href={`/show/${show.id}/tracks`} className={cn(btnSmSecondary, 'no-underline')}>
                Tracks
              </Link>{' '}
              <a
                href={`/api/export/shows/${show.id}/tracks`}
                className={cn(btnSmSecondary, 'no-underline')}
                download
              >
                Export TSV
              </a>{' '}
              {show.isActive ? (
                <button type="button" className={btnSmWarning} onClick={() => void deactivate(show.id)}>
                  Stop show
                </button>
              ) : (
                <button type="button" className={btnSmPrimary} onClick={() => void activate(show.id)}>
                  Start show
                </button>
              )}{' '}
              {!show.autoStartEnd && endAfter && (
                <span className="self-center text-sm text-stone-500">(auto start/end off)</span>
              )}{' '}
              <Link href={`/edit-show/${show.id}`} className={cn(btnSmPrimary, 'no-underline')}>
                Edit
              </Link>{' '}
              <button type="button" className={btnSmDanger} onClick={() => void remove(show.id)}>
                Delete
              </button>
            </p>
            {show.episodeNumber != null && (
              <span className="mr-1 text-stone-400">Ep {show.episodeNumber}</span>
            )}
            {show.defaultMeta && <small className="text-stone-400">{show.defaultMeta}</small>}
            <hr className="my-3 border-stone-700" />
          </div>
        )
      })}
    </div>
  )
}
