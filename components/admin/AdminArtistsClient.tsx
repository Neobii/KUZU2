'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useRef, useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'
import { uploadEditorImage } from '@/lib/tiptap-upload'
import {
  btnPrimary,
  btnSecondary,
  btnXsDanger,
  btnXsPrimary,
  btnXsSecondary,
  checkboxRowClass,
  formGroupClass,
  inputClassLight,
  labelClassLight,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'
import { formatShowDateInputValue } from '@/lib/local-artist-show'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ArtistShow = {
  id: string
  flyerImageUrl: string | null
  content: string | null
  showDate: string | null
  isActive: boolean
  updatedAt: string
}

type ArtistRow = {
  id: string
  artistName: string
  imageUrl: string | null
  bio: string | null
  isLocalArtist: boolean
  createdAt: string
  updatedAt: string
  _count: { tracks: number; shows: number }
  shows: ArtistShow[]
}

type ArtistValues = {
  artistName: string
  imageUrl: string
  bio: string
  isLocalArtist: boolean
}

export function AdminArtistsClient() {
  const { data, mutate } = useSWR<{ artists?: ArtistRow[] }>('/api/admin/artists', fetcher)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ArtistRow | null>(null)
  const [managingShows, setManagingShows] = useState<ArtistRow | null>(null)

  async function save(v: ArtistValues, id?: string) {
    const body: Record<string, string | boolean> = {
      artistName: v.artistName,
      isLocalArtist: v.isLocalArtist,
    }
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
      <p className="mb-4 text-sm text-stone-400">
        Mark local artists and add show promos (flyer + TipTap for date/doors/details). When
        production status has “Display local artist shows” on, playing that artist surfaces the
        active promo via{' '}
        <code className="text-stone-300">/api/tracking/current-additional-info</code>.
      </p>
      <p className="mb-4">
        <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
          Add artist
        </button>
      </p>
      {creating && (
        <ArtistForm
          title="Add artist"
          initial={{ artistName: '', imageUrl: '', bio: '', isLocalArtist: false }}
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
            isLocalArtist: editing.isLocalArtist,
          }}
          onSave={(v) => void save(v, editing.id)}
          onCancel={() => setEditing(null)}
        />
      )}
      {managingShows && (
        <ArtistShowsPanel
          artist={managingShows}
          onClose={() => setManagingShows(null)}
          onChanged={() => void mutate()}
        />
      )}
      <div className="overflow-x-auto">
        <table className={cn(tableClass, 'text-stone-300')}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Artist</th>
              <th className={tableCellClass}>Local</th>
              <th className={tableCellClass}>Image</th>
              <th className={tableCellClass}>Shows</th>
              <th className={tableCellClass}>Tracks</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id}>
                <td className={tableCellClass}>{a.artistName}</td>
                <td className={tableCellClass}>{a.isLocalArtist ? 'Yes' : '—'}</td>
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
                <td className={tableCellClass}>{a._count?.shows ?? a.shows?.length ?? 0}</td>
                <td className={tableCellClass}>
                  {(a._count?.tracks ?? 0) > 0 ? (
                    <Link
                      href={`/artists/${a.id}/tracks`}
                      className="text-amber-400 no-underline hover:text-amber-300"
                    >
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
                  <button
                    type="button"
                    className={btnXsSecondary}
                    onClick={() => setManagingShows(a)}
                  >
                    Shows
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
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={v.isLocalArtist}
            onChange={(e) => setV({ ...v, isLocalArtist: e.target.checked })}
          />
          Local artist
        </label>
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

function ArtistShowsPanel({
  artist,
  onClose,
  onChanged,
}: {
  artist: ArtistRow
  onClose: () => void
  onChanged: () => void
}) {
  const { data, mutate } = useSWR<{ shows?: ArtistShow[] }>(
    `/api/admin/artists/${artist.id}/shows`,
    fetcher
  )
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ArtistShow | null>(null)
  const shows = data?.shows ?? artist.shows ?? []

  async function refresh() {
    await mutate()
    onChanged()
  }

  async function remove(showId: string) {
    if (!confirm('Delete this show promo?')) return
    await fetch(`/api/admin/artists/${artist.id}/shows/${showId}`, { method: 'DELETE' })
    await refresh()
  }

  return (
    <div className="mb-6 rounded-lg border border-stone-600 bg-white p-4 text-stone-900 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <div className="text-lg font-semibold">Shows — {artist.artistName}</div>
        <div className="flex gap-2">
          <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
            Add show
          </button>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <p className="mb-3 text-sm text-stone-600">
        Set a show date so tracking can pick the latest promo within a month of today. Put doors,
        venue, and other details in TipTap. Mark shows Active to make them eligible.
      </p>
      {(creating || editing) && (
        <ShowForm
          artistId={artist.id}
          title={editing ? 'Edit show' : 'Add show'}
          initial={
            editing
              ? {
                  flyerImageUrl: editing.flyerImageUrl ?? '',
                  content: editing.content ?? '',
                  showDate: formatShowDateInputValue(editing.showDate),
                  isActive: editing.isActive,
                }
              : { flyerImageUrl: '', content: '', showDate: '', isActive: true }
          }
          showId={editing?.id}
          onDone={async () => {
            setCreating(false)
            setEditing(null)
            await refresh()
          }}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
      <ul className="space-y-3">
        {shows.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-start gap-3 rounded border border-stone-200 p-3"
          >
            {s.flyerImageUrl ? (
              <img
                src={s.flyerImageUrl}
                alt=""
                className="h-20 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-20 w-16 items-center justify-center rounded bg-stone-100 text-xs text-stone-400">
                No flyer
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-sm font-medium">
                {s.isActive ? (
                  <span className="text-emerald-700">Active</span>
                ) : (
                  <span className="text-stone-500">Inactive</span>
                )}
                {s.showDate ? (
                  <span className="ml-2 text-stone-600">
                    · {formatShowDateInputValue(s.showDate)}
                  </span>
                ) : (
                  <span className="ml-2 text-amber-700">· no show date</span>
                )}
              </div>
              <div
                className="prose prose-sm max-w-none text-stone-700"
                dangerouslySetInnerHTML={{ __html: s.content || '<p><em>No details</em></p>' }}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnXsPrimary} onClick={() => setEditing(s)}>
                Edit
              </button>
              <button type="button" className={btnXsDanger} onClick={() => void remove(s.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
        {shows.length === 0 && !creating ? (
          <li className="text-sm text-stone-500">No show promos yet.</li>
        ) : null}
      </ul>
    </div>
  )
}

function ShowForm({
  artistId,
  showId,
  title,
  initial,
  onDone,
  onCancel,
}: {
  artistId: string
  showId?: string
  title: string
  initial: { flyerImageUrl: string; content: string; showDate: string; isActive: boolean }
  onDone: () => void | Promise<void>
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadEditorImage(file)
      setV((prev) => ({ ...prev, flyerImageUrl: url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setError(null)
    const res = await fetch(
      showId
        ? `/api/admin/artists/${artistId}/shows/${showId}`
        : `/api/admin/artists/${artistId}/shows`,
      {
        method: showId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flyerImageUrl: v.flyerImageUrl,
          content: v.content,
          showDate: v.showDate || null,
          isActive: v.isActive,
        }),
      }
    )
    if (!res.ok) {
      setError('Could not save show')
      return
    }
    await onDone()
  }

  return (
    <div className="mb-4 rounded border border-stone-300 bg-stone-50 p-3">
      <div className="mb-3 font-medium">{title}</div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Show date</label>
        <input
          type="date"
          className={inputClassLight}
          value={v.showDate}
          onChange={(e) => setV({ ...v, showDate: e.target.value })}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Flyer image</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="text-sm"
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={btnXsSecondary}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {v.flyerImageUrl ? (
            <button
              type="button"
              className={btnXsDanger}
              onClick={() => setV({ ...v, flyerImageUrl: '' })}
            >
              Clear flyer
            </button>
          ) : null}
        </div>
        {v.flyerImageUrl ? (
          <img
            src={v.flyerImageUrl}
            alt=""
            className="mt-2 h-32 max-w-full rounded object-contain"
          />
        ) : null}
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Show details (doors, venue, notes…)</label>
        <TipTapEditor value={v.content} onChange={(html) => setV({ ...v, content: html })} />
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={v.isActive}
            onChange={(e) => setV({ ...v, isActive: e.target.checked })}
          />
          Active (eligible when this artist is playing)
        </label>
      </div>
      {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
      <button type="button" className={btnPrimary} onClick={() => void save()}>
        Save show
      </button>{' '}
      <button type="button" className={cn(btnSecondary, 'ml-2')} onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
