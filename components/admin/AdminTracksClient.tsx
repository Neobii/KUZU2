'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  btnPrimary,
  btnSecondary,
  btnXsPrimary,
  formGroupClass,
  inputClass,
  labelClass,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(typeof body.error === 'string' ? body.error : `Request failed (${res.status})`)
  }
  return res.json()
}

type Track = {
  id: string
  songTitle: string
  artist: string | null
  playDate: string | null
  show: { id: string; showName: string } | null
}

function todayDateInputValue(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatPlayDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminTracksClient() {
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState(todayDateInputValue)
  const [dateTo, setDateTo] = useState(todayDateInputValue)
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [cleanupMessage, setCleanupMessage] = useState('')
  const [cleaning, setCleaning] = useState(false)

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({
      search: q,
      take: '150',
      dateFrom,
      dateTo,
    })
    return `/api/admin/tracks?${params}`
  }, [q, dateFrom, dateTo])

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      format: 'licensing',
      preview: 'count',
      dateFrom,
      dateTo,
    })
    return `/api/export/tracks?${params}`
  }, [dateFrom, dateTo])

  const { data: tracks, error, isLoading, mutate } = useSWR<Track[]>(listUrl, fetcher)
  const { data: preview } = useSWR<{ count: number }>(previewUrl, fetcher)

  async function exportLicensingCsv() {
    setExportError('')
    if (!dateFrom || !dateTo) {
      setExportError('Choose both a start date and end date.')
      return
    }
    if (dateFrom > dateTo) {
      setExportError('End date must be on or after start date.')
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: 'licensing',
        dateFrom,
        dateTo,
      })
      const res = await fetch(`/api/export/tracks?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setExportError(body.error ?? 'Export failed.')
        return
      }
      const blob = await res.blob()
      const filename = `tracks_${dateFrom}___${dateTo}_.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const exportCount = preview?.count

  async function cleanupDuplicates() {
    if (!dateFrom || !dateTo) {
      setCleanupMessage('Choose both a start date and end date.')
      return
    }
    if (dateFrom > dateTo) {
      setCleanupMessage('End date must be on or after start date.')
      return
    }
    if (
      !window.confirm(
        `Remove duplicate track rows from ${dateFrom} through ${dateTo}? Keeps the earliest play of each song per station day (Central Time).`
      )
    ) {
      return
    }
    setCleanupMessage('')
    setCleaning(true)
    try {
      const res = await fetch('/api/admin/tracks/cleanup-duplicates', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCleanupMessage(body.error ?? 'Cleanup failed.')
        return
      }
      setCleanupMessage(
        body.deleted
          ? `Removed ${body.deleted} duplicate row(s) from ${body.scanned ?? '?'} scanned (${body.duplicateGroups ?? '?'} song groups).`
          : `No duplicates found in ${body.scanned ?? '?'} track(s) for ${dateFrom} through ${dateTo}.`
      )
      await mutate(undefined, { revalidate: true })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 rounded-lg border border-stone-700 bg-stone-900/50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className={formGroupClass}>
          <label className={labelClass} htmlFor="tracks-date-from">
            From date
          </label>
          <input
            id="tracks-date-from"
            type="date"
            className={cn(inputClass, 'max-w-xs')}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className={formGroupClass}>
          <label className={labelClass} htmlFor="tracks-date-to">
            To date
          </label>
          <input
            id="tracks-date-to"
            type="date"
            className={cn(inputClass, 'max-w-xs')}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className={formGroupClass}>
          <button
            type="button"
            className={btnPrimary}
            disabled={exporting || exportCount === 0}
            onClick={() => void exportLicensingCsv()}
          >
            {exporting ? 'Exporting…' : 'Export as CSV'}
          </button>
          <p className="mt-2 text-xs text-stone-400">
            Pipe-delimited song tracks with play dates (Central Time days). End date is inclusive.
          </p>
          {exportCount != null ? (
            <p className="mt-1 text-xs text-stone-300">
              {exportCount === 0
                ? 'No exportable tracks in this date range.'
                : `${exportCount} track${exportCount === 1 ? '' : 's'} ready to export.`}
            </p>
          ) : null}
          {exportError ? <p className="mt-2 text-sm text-red-400">{exportError}</p> : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className={cn(inputClass, 'max-w-md')}
          placeholder="Search title, artist, album, label…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={btnSecondary}
          disabled={cleaning}
          onClick={() => void cleanupDuplicates()}
        >
          {cleaning ? 'Cleaning…' : 'Remove duplicate plays'}
        </button>
        {cleanupMessage ? <p className="text-sm text-stone-300">{cleanupMessage}</p> : null}
      </div>

      {isLoading ? <p className="text-sm text-stone-400">Loading tracks…</p> : null}
      {error ? (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Could not load tracks.'}
        </p>
      ) : null}
      {!isLoading && !error && tracks?.length === 0 ? (
        <p className="text-sm text-stone-400">No tracks with play dates in this range.</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Played</th>
              <th className={tableCellClass}>Title</th>
              <th className={tableCellClass}>Artist</th>
              <th className={tableCellClass}>Show</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {tracks?.map((t) => (
              <tr key={t.id}>
                <td className={tableCellClass}>{formatPlayDate(t.playDate)}</td>
                <td className={tableCellClass}>{t.songTitle}</td>
                <td className={tableCellClass}>{t.artist ?? '—'}</td>
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
