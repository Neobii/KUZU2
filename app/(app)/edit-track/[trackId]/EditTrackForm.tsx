'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trackEditSchema } from '@/lib/schemas/forms'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

type Form = z.infer<typeof trackEditSchema>

export function EditTrackForm({
  track,
}: {
  track: {
    id: string
    songTitle: string
    artist: string | null
    album: string | null
    label: string | null
    trackLength: string | null
    trackType: string
    showId: string | null
  }
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(trackEditSchema),
    defaultValues: {
      songTitle: track.songTitle,
      artist: track.artist ?? '',
      album: track.album ?? '',
      label: track.label ?? '',
      trackLength: track.trackLength ?? '',
      trackType: (track.trackType as Form['trackType']) ?? 'song',
    },
  })

  async function onSubmit(data: Form) {
    const res = await fetch(`/api/tracks/${track.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      if (track.showId) router.push(`/show/${track.showId}/tracks`)
      else router.push('/track-lists')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 560 }}>
      <div className="form-group">
        <label>Track type</label>
        <select className="form-control" {...register('trackType')}>
          <option value="song">Song</option>
          <option value="talkingPoint">Talking Point</option>
          <option value="showMeta">Show Meta</option>
          <option value="producerBio">Producer Bio</option>
          <option value="kuzuDefault">Kuzu Default</option>
        </select>
      </div>
      <div className="form-group">
        <label>Song title</label>
        <input className="form-control" {...register('songTitle')} />
        {errors.songTitle && <span className="text-danger">{errors.songTitle.message}</span>}
      </div>
      <div className="form-group">
        <label>Artist</label>
        <input className="form-control" {...register('artist')} />
      </div>
      <div className="form-group">
        <label>Album</label>
        <input className="form-control" {...register('album')} />
      </div>
      <div className="form-group">
        <label>Label</label>
        <input className="form-control" {...register('label')} />
      </div>
      <div className="form-group">
        <label>Length (mm:ss)</label>
        <input className="form-control" {...register('trackLength')} />
      </div>
      <button type="submit" className="btn btn-primary">
        Save
      </button>
    </form>
  )
}
