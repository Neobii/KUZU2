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

type ArtistShowRow = {
  id: string
  flyerImageUrl: string | null
  content: string | null
  isActive: boolean
  updatedAt: string
  artist: {
    id: string
    artistName: string
    isLocalArtist: boolean
  }
}

export function AdminShowsClient() {
  const { data: shows, mutate, isLoading } = useSWR<Show[]>('/api/shows', fetcher)
  const {
    data: artistShowsData,
    mutate: mutateArtistShows,
    isLoading: artistShowsLoading,
  } = useSWR<{ shows?: ArtistShowRow[] }>('/api/admin/artist-shows', fetcher)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!Array.isArray(shows)) return []
    if (!q.trim()) return shows
    const s = q.toLowerCase()
    return shows.filter((x) => x.showName.toLowerCase().includes(s))
  }, [shows, q])

  const artistShows = useMemo(() => {
    const list = artistShowsData?.shows ?? []
    if (!q.trim()) return list
    const s = q.toLowerCase()
    return list.filter(
      (row) =>
        row.artist.artistName.toLowerCase().includes(s) ||
        (row.content ?? '').toLowerCase().includes(s)
    )
  }, [artistShowsData, q])

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

  async function setArtistShowActive(artistId: string, showId: string, isActive: boolean) {
    await fetch(`/api/admin/artists/${artistId}/shows/${showId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    void mutateArtistShows()
  }

  async function removeArtistShow(artistId: string, showId: string) {
    if (!confirm('Delete this local artist show promo?')) return
    await fetch(`/api/admin/artists/${artistId}/shows/${showId}`, { method: 'DELETE' })
    void mutateArtistShows()
  }

  return (
    <div>
      <div className="mb-4">
        <input
          className={cn(inputClass, 'max-w-md')}
          placeholder="Search radio shows or local artist shows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search shows"
        />
      </div>

      <h3 className="mb-3 text-lg font-semibold text-stone-100">Radio shows</h3>
      {isLoading ? (
        <EmptyState message="Loading shows…" />
      ) : (
        <StackedList
          emptyMessage={q.trim() ? 'No radio shows match that search.' : 'No radio shows found.'}
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

      <h3 className="mb-2 mt-8 text-lg font-semibold text-stone-100">Local artist shows</h3>
      <p className="mb-3 text-sm text-stone-400">
        Flyer + TipTap promos from Artists. Manage details on the Artists page; toggle Active here
        for tracking additional info.
      </p>
      {artistShowsLoading ? (
        <EmptyState message="Loading local artist shows…" />
      ) : (
        <StackedList
          emptyMessage={
            q.trim()
              ? 'No local artist shows match that search.'
              : 'No local artist show promos yet.'
          }
          emptyAction={
            !q.trim() ? (
              <Link href="/artists" className={cn(btnSmPrimary, 'no-underline')}>
                Add one on Artists
              </Link>
            ) : undefined
          }
        >
          {artistShows.map((row) => {
            const metaParts = [
              row.isActive ? 'Active promo' : 'Inactive',
              !row.artist.isLocalArtist ? 'artist not marked local' : null,
            ].filter(Boolean)

            return (
              <StackedListItem
                key={row.id}
                title={row.artist.artistName}
                href="/artists"
                meta={metaParts.join(' · ')}
                actions={
                  <>
                    <Link href="/artists" className={cn(btnSmSecondary, 'no-underline')}>
                      Open Artists
                    </Link>
                    {row.isActive ? (
                      <button
                        type="button"
                        className={btnSmWarning}
                        onClick={() => void setArtistShowActive(row.artist.id, row.id, false)}
                      >
                        Deactivate promo
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={btnSmPrimary}
                        onClick={() => void setArtistShowActive(row.artist.id, row.id, true)}
                      >
                        Activate promo
                      </button>
                    )}
                    <button
                      type="button"
                      className={btnSmDanger}
                      onClick={() => void removeArtistShow(row.artist.id, row.id)}
                    >
                      Delete
                    </button>
                  </>
                }
              >
                <div className="flex flex-wrap gap-3">
                  {row.flyerImageUrl ? (
                    <img
                      src={row.flyerImageUrl}
                      alt=""
                      className="h-24 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-16 items-center justify-center rounded bg-stone-800 text-xs text-stone-500">
                      No flyer
                    </div>
                  )}
                  <div
                    className="min-w-0 flex-1 text-stone-300"
                    dangerouslySetInnerHTML={{
                      __html: row.content || '<p><em>No details</em></p>',
                    }}
                  />
                </div>
              </StackedListItem>
            )
          })}
        </StackedList>
      )}
    </div>
  )
}
