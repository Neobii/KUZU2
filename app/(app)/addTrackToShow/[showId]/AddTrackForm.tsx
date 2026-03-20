'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddTrackForm({ showId }: { showId: string }) {
  const router = useRouter()
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 8 }}>
        <label>Track Type</label>
        <select value={trackType} onChange={(e) => setTrackType(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }}>
          <option value="song">Song</option>
          <option value="talkingPoint">Talking Point</option>
          <option value="showMeta">Show Meta</option>
          <option value="producerBio">Producer Bio</option>
          <option value="kuzuDefault">Kuzu Default</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Song Title</label>
        <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={{ display: 'block', width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Artist</label>
        <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Album</label>
        <input type="text" value={album} onChange={(e) => setAlbum(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Label</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Track Length (mm:ss)</label>
        <input type="text" value={trackLength} onChange={(e) => setTrackLength(e.target.value)} placeholder="3:45" style={{ display: 'block', width: '100%', padding: 8 }} />
      </div>
      <button type="submit" style={{ padding: 10, cursor: 'pointer' }}>Add Track</button>
    </form>
  )
}
