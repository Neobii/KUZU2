'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { btnPrimaryLg, btnSecondary, checkboxRowClass } from '@/lib/ui'

export default function StartShowPage() {
  const router = useRouter()
  const [autoplayOnStart, setAutoplayOnStart] = useState(false)
  const [autoplayOnDate, setAutoplayOnDate] = useState(false)
  const [stopAfterLastSong, setStopAfterLastSong] = useState(false)
  const [stopOnCalendarEnd, setStopOnCalendarEnd] = useState(false)

  async function createShow() {
    const res = await fetch('/api/shows/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autoplayOnStart,
        autoplayOnDate,
        stopAfterLastSong,
        stopOnCalendarEnd,
      }),
    })
    if (res.ok) {
      const show = await res.json()
      router.push(`/show/${show.id}/tracks`)
      router.refresh()
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-stone-100">Start a new show</h2>
      <p className="mb-4 text-stone-400">This creates a show from your program defaults.</p>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            className="rounded border-stone-600"
            checked={autoplayOnStart}
            onChange={(e) => setAutoplayOnStart(e.target.checked)}
          />
          Autoplay on show start
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            className="rounded border-stone-600"
            checked={autoplayOnDate}
            onChange={(e) => setAutoplayOnDate(e.target.checked)}
          />
          Autoplay on calendar date
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            className="rounded border-stone-600"
            checked={stopAfterLastSong}
            onChange={(e) => setStopAfterLastSong(e.target.checked)}
          />
          Stop show after last song
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            className="rounded border-stone-600"
            checked={stopOnCalendarEnd}
            onChange={(e) => setStopOnCalendarEnd(e.target.checked)}
          />
          Stop show on calendar end
        </label>
      </div>
      {stopOnCalendarEnd && (
        <p className="mb-4 text-sm text-stone-500">
          Set an end date when editing the show so calendar stop has a time to fire.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="button" className={btnPrimaryLg} onClick={() => void createShow()}>
          Create Show
        </button>
        <Link href="/producer/shows" className={btnSecondary}>
          Cancel
        </Link>
      </div>
    </div>
  )
}
