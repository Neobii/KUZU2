'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showEditSchema } from '@/lib/schemas/forms'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from '@/components/TipTapEditor'

type Form = z.infer<typeof showEditSchema>

export function EditShowForm({
  show,
}: {
  show: {
    id: string
    showName: string
    showStart: string | null
    showEnd: string | null
    defaultMeta: string | null
    description: string | null
    hasRadioLogikTracking: boolean
    hasMessagingEnabled: boolean
  }
}) {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(showEditSchema),
    defaultValues: {
      showName: show.showName,
      showStart: show.showStart ? show.showStart.slice(0, 16) : '',
      showEnd: show.showEnd ? show.showEnd.slice(0, 16) : '',
      defaultMeta: show.defaultMeta ?? '',
      description: show.description ?? '',
      hasRadioLogikTracking: show.hasRadioLogikTracking,
      hasMessagingEnabled: show.hasMessagingEnabled,
    },
  })

  async function onSubmit(data: Form) {
    const res = await fetch(`/api/shows/${show.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        showStart: data.showStart ? new Date(data.showStart).toISOString() : null,
        showEnd: data.showEnd ? new Date(data.showEnd).toISOString() : null,
      }),
    })
    if (res.ok) {
      router.push(`/show/${show.id}/tracks`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 720 }}>
      <div className="form-group">
        <label>Show name</label>
        <input className="form-control" {...register('showName')} />
        {errors.showName && <span className="text-danger">{errors.showName.message}</span>}
      </div>
      <div className="form-group">
        <label>Start (local)</label>
        <input className="form-control" type="datetime-local" {...register('showStart')} />
      </div>
      <div className="form-group">
        <label>End (local)</label>
        <input className="form-control" type="datetime-local" {...register('showEnd')} />
      </div>
      <div className="form-group">
        <label>Default meta</label>
        <textarea className="form-control" rows={2} {...register('defaultMeta')} />
      </div>
      <div className="form-group">
        <label>Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TipTapEditor value={field.value ?? ''} onChange={field.onChange} minHeight={180} />
          )}
        />
      </div>
      <div className="checkbox">
        <label>
          <input type="checkbox" {...register('hasRadioLogikTracking')} /> Radio Logik tracking
        </label>
      </div>
      <div className="checkbox">
        <label>
          <input type="checkbox" {...register('hasMessagingEnabled')} /> Messaging enabled
        </label>
      </div>
      <button type="submit" className="btn btn-primary">
        Save
      </button>
    </form>
  )
}
