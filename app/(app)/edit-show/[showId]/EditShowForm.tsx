'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showEditSchema } from '@/lib/schemas/forms'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from '@/components/TipTapEditor'
import { btnPrimary, checkboxRowClass, formGroupClass, inputClass, labelClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
      <div className={formGroupClass}>
        <label className={labelClass}>Show name</label>
        <input className={inputClass} {...register('showName')} />
        {errors.showName && <span className="text-sm text-red-400">{errors.showName.message}</span>}
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Start (local)</label>
        <input className={inputClass} type="datetime-local" {...register('showStart')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>End (local)</label>
        <input className={inputClass} type="datetime-local" {...register('showEnd')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Default meta</label>
        <textarea className={cn(inputClass, 'min-h-[5rem]')} rows={2} {...register('defaultMeta')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Description</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TipTapEditor value={field.value ?? ''} onChange={field.onChange} minHeight={180} />
          )}
        />
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" className="rounded border-stone-600" {...register('hasRadioLogikTracking')} />
          Radio Logik tracking
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" className="rounded border-stone-600" {...register('hasMessagingEnabled')} />
          Messaging enabled
        </label>
      </div>
      <button type="submit" className={btnPrimary}>
        Save
      </button>
    </form>
  )
}
