'use client'

import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export type ArtistOption = { id: string; artistName: string }

type SearchResponse = { artists?: ArtistOption[] }

export function ArtistAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (artist: ArtistOption) => void
  placeholder?: string
}) {
  const [text, setText] = useState(value)
  const [options, setOptions] = useState<ArtistOption[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync with the parent-controlled value (e.g. edit-form prefill / selection).
  useEffect(() => {
    setText(value)
  }, [value])

  // Close the dropdown when clicking anywhere outside the component.
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
    const res = await fetch(`/api/artists?search=${encodeURIComponent(q)}`)
    const data: SearchResponse = await res.json()
    if (seq !== seqRef.current) return // ignore stale responses
    setOptions(Array.isArray(data.artists) ? data.artists : [])
  }

  function handleTextChange(textValue: string) {
    setText(textValue)
    setOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void runSearch(textValue)
    }, 250)
  }

  function selectArtist(artist: ArtistOption) {
    setText(artist.artistName)
    setOptions([])
    setOpen(false)
    onChange(artist)
  }

  async function addArtist(name: string) {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistName: name }),
      })
      const data: { artist?: ArtistOption } = await res.json()
      if (res.ok && data.artist) selectArtist(data.artist)
    } finally {
      setAdding(false)
    }
  }

  const trimmed = text.trim()
  const showAdd = open && trimmed !== '' && options.length === 0

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClass}
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleTextChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-stone-700 bg-stone-900 py-1 shadow-lg">
          {options.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-stone-200 hover:bg-stone-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectArtist(a)}
              >
                {a.artistName}
              </button>
            </li>
          ))}
          {showAdd && (
            <li>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-amber-400 hover:bg-stone-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void addArtist(trimmed)}
                disabled={adding}
              >
                {adding ? 'Adding…' : `Add '${trimmed}' to artists`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
