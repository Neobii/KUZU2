'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtistAutocomplete } from '@/components/ArtistAutocomplete'
import { btnPrimary, formGroupClass, inputClass, labelClass } from '@/lib/ui'

export function AddTrackForm({ showId }: { showId: string }) {
  const router = useRouter()
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [artistId, setArtistId] = useState<string | null>(null)
  const [album, setAlbum] = useState('')
  const [label, setLabel] = useState('')
  const [trackLength, setTrackLength] = useState('')
  const [trackType, setTrackType] = useState('song')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        showId,
        songTitle,
        artist,
        artistId: artistId ?? undefined,
        album,
        label,
        trackLength,
        trackType,
      }),
    })
    if (res.ok) {
      router.push(`/show/${showId}/tracks`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <div className={formGroupClass}>
        <label className={labelClass}>Track Type</label>
        <select className={inputClass} value={trackType} onChange={(e) => setTrackType(e.target.value)}>
          <option value="song">Song</option>
          <option value="talkingPoint">Talking Point</option>
          <option value="showMeta">Show Meta</option>
          <option value="producerBio">Producer Bio</option>
          <option value="kuzuDefault">Kuzu Default</option>
        </select>
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Song Title</label>
        <input
          className={inputClass}
          type="text"
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          required
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Artist</label>
        <ArtistAutocomplete
          value={artist}
          placeholder="Search or add an artist…"
          onChange={(a) => {
            setArtist(a.artistName)
            setArtistId(a.id)
          }}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Album</label>
        <input className={inputClass} type="text" value={album} onChange={(e) => setAlbum(e.target.value)} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Label</label>
        <input className={inputClass} type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Track Length (mm:ss)</label>
        <input
          className={inputClass}
          type="text"
          value={trackLength}
          onChange={(e) => setTrackLength(e.target.value)}
          placeholder="3:45"
        />
      </div>
      <button type="submit" className={btnPrimary}>
        Add Track
      </button>
    </form>
  )
}
