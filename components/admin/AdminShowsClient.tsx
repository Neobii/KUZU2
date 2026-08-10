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
  inputClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'
import { StackedList, StackedListItem } from '@/components/ui/StackedList'
import { EmptyState } from '@/components/ui/EmptyState'

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
  const { data: shows, mutate, isLoading } = useSWR<Show[]>('/api/shows', fetcher)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!Array.isArray(shows)) return []
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
      <div className="mb-4">
        <input
          className={cn(inputClass, 'max-w-md')}
          placeholder="Search shows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search shows"
        />
      </div>

      {isLoading ? (
        <EmptyState message="Loading shows…" />
      ) : (
        <StackedList
          emptyMessage={
            q.trim() ? 'No shows match that search.' : 'No shows found.'
          }
        >
          {filtered.map((show) => {
            const endAfter =
              show.showEnd && moment(show.showEnd).add(10, 'minutes').isAfter(moment())
            const timeLabel = [
              show.showStart ? prettifyDate(show.showStart) : null,
              show.showStart && show.showEnd
                ? `${prettifySimpleTime(show.showStart)} – ${prettifySimpleTime(show.showEnd)}`
                : show.showStart
                  ? prettifySimpleTime(show.showStart)
                  : null,
            ]
              .filter(Boolean)
              .join(', ')

            const subtitleParts = [
              show.episodeNumber != null ? `Ep ${show.episodeNumber}` : null,
              show.defaultMeta,
              show.isActive ? 'Live' : null,
              !show.autoStartEnd && endAfter ? 'auto start/end off' : null,
            ].filter(Boolean)

            return (
              <StackedListItem
                key={show.id}
                title={show.showName}
                href={`/show/${show.id}/tracks`}
                meta={timeLabel || undefined}
                subtitle={subtitleParts.length ? subtitleParts.join(' · ') : undefined}
                actions={
                  <>
                    <Link
                      href={`/show/${show.id}/tracks`}
                      className={cn(btnSmSecondary, 'no-underline')}
                    >
                      Tracks
                    </Link>
                    <a
                      href={`/api/export/shows/${show.id}/tracks`}
                      className={cn(btnSmSecondary, 'no-underline')}
                      download
                    >
                      Export TSV
                    </a>
                    {show.isActive ? (
                      <button
                        type="button"
                        className={btnSmWarning}
                        onClick={() => void deactivate(show.id)}
                      >
                        Stop show
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={btnSmPrimary}
                        onClick={() => void activate(show.id)}
                      >
                        Start show
                      </button>
                    )}
                    <Link
                      href={`/edit-show/${show.id}`}
                      className={cn(btnSmPrimary, 'no-underline')}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={btnSmDanger}
                      onClick={() => void remove(show.id)}
                    >
                      Delete
                    </button>
                  </>
                }
              />
            )
          })}
        </StackedList>
      )}
    </div>
  )
}
