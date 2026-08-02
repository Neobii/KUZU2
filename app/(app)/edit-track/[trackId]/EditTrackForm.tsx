'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trackEditSchema } from '@/lib/schemas/forms'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ArtistAutocomplete } from '@/components/ArtistAutocomplete'
import { btnPrimary, formGroupClass, inputClass, labelClass } from '@/lib/ui'

type Form = z.infer<typeof trackEditSchema>

export function EditTrackForm({
  track,
}: {
  track: {
    id: string
    songTitle: string
    artist: string | null
    artistId: string | null
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(trackEditSchema),
    defaultValues: {
      songTitle: track.songTitle,
      artist: track.artist ?? '',
      artistId: track.artistId ?? null,
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl">
      <div className={formGroupClass}>
        <label className={labelClass}>Track type</label>
        <select className={inputClass} {...register('trackType')}>
          <option value="song">Song</option>
          <option value="talkingPoint">Talking Point</option>
          <option value="showMeta">Show Meta</option>
          <option value="producerBio">Producer Bio</option>
          <option value="kuzuDefault">Kuzu Default</option>
        </select>
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Song title</label>
        <input className={inputClass} {...register('songTitle')} />
        {errors.songTitle && <span className="text-sm text-red-400">{errors.songTitle.message}</span>}
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Artist</label>
        <ArtistAutocomplete
          value={watch('artist') ?? ''}
          placeholder="Search or add an artist…"
          onChange={(a) => {
            setValue('artist', a.artistName)
            setValue('artistId', a.id)
          }}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Album</label>
        <input className={inputClass} {...register('album')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Label</label>
        <input className={inputClass} {...register('label')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Length (mm:ss)</label>
        <input className={inputClass} {...register('trackLength')} />
      </div>
      <button type="submit" className={btnPrimary}>
        Save
      </button>
    </form>
  )
}
