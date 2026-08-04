'use client'

import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export type TrackSuggestion = {
  songTitle: string
  artist: string | null
  artistId: string | null
  album: string | null
  label: string | null
  trackLength: string | null
  trackType: string
}

type SearchResponse = { tracks?: TrackSuggestion[] }

export function TrackAutocomplete({
  value,
  onTitleChange,
  onSelect,
  placeholder,
  required,
}: {
  value: string
  onTitleChange: (title: string) => void
  onSelect: (track: TrackSuggestion) => void
  placeholder?: string
  required?: boolean
}) {
  const [options, setOptions] = useState<TrackSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function runSearch(query: string) {
    const q = query.trim()
    if (!q) {
      setOptions([])
      return
    }
    const seq = ++seqRef.current
    const res = await fetch(`/api/tracks/search?search=${encodeURIComponent(q)}`)
    const data: SearchResponse = await res.json()
    if (seq !== seqRef.current) return
    setOptions(Array.isArray(data.tracks) ? data.tracks : [])
  }

  function handleTextChange(textValue: string) {
    onTitleChange(textValue)
    setOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void runSearch(textValue)
    }, 250)
  }

  function pick(track: TrackSuggestion) {
    onSelect(track)
    setOptions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClass}
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-stone-700 bg-stone-900 py-1 shadow-lg">
          {options.map((t) => (
            <li key={`${t.songTitle}|${t.artist ?? ''}`}>
              <button
                type="button"
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm hover:bg-stone-800',
                  'text-stone-200'
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(t)}
              >
                <span className="font-medium text-stone-100">{t.songTitle}</span>
                {t.artist ? (
                  <span className="text-stone-400"> — {t.artist}</span>
                ) : null}
                {t.album ? <span className="block text-xs text-stone-500">{t.album}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
