'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import {
  btnPrimary,
  btnXsPrimary,
  formGroupClass,
  inputClass,
  labelClass,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Track = {
  id: string
  songTitle: string
  artist: string | null
  show: { id: string; showName: string } | null
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function AdminTracksClient() {
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const { data: tracks } = useSWR<Track[]>(
    `/api/admin/tracks?search=${encodeURIComponent(q)}&take=150`,
    fetcher
  )

  async function exportLicensingCsv() {
    setExportError('')
    const from = parseLocalDate(dateFrom)
    const to = parseLocalDate(dateTo)
    if (!from || !to) {
      setExportError('Choose both a start date and end date.')
      return
    }
    if (from >= to) {
      setExportError('End date must be after start date.')
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: 'licensing',
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
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
            disabled={exporting}
            onClick={() => void exportLicensingCsv()}
          >
            {exporting ? 'Exporting…' : 'Export as CSV'}
          </button>
          <p className="mt-2 text-xs text-stone-400">
            Pipe-delimited song tracks only, for licensing export.
          </p>
          {exportError ? <p className="mt-2 text-sm text-red-400">{exportError}</p> : null}
        </div>
      </div>

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
