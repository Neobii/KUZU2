'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showEditSchema } from '@/lib/schemas/forms'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from '@/components/TipTapEditor'
import { DateTimeCalendarField } from '@/components/DateTimeCalendarField'
import { isoToLocalDatetimeInputValue } from '@/lib/datetime-local'
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
    autoplayOnStart: boolean
    autoplayOnDate: boolean
    episodeNumber: number | null
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
      showStart: isoToLocalDatetimeInputValue(show.showStart),
      showEnd: isoToLocalDatetimeInputValue(show.showEnd),
      defaultMeta: show.defaultMeta ?? '',
      description: show.description ?? '',
      hasRadioLogikTracking: show.hasRadioLogikTracking,
      hasMessagingEnabled: show.hasMessagingEnabled,
      autoplayOnStart: show.autoplayOnStart,
      autoplayOnDate: show.autoplayOnDate,
      episodeNumber: (show.episodeNumber ?? '') as never,
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
        <label className={labelClass} htmlFor="edit-show-start">
          Start (local)
        </label>
        <Controller
          name="showStart"
          control={control}
          render={({ field }) => (
            <DateTimeCalendarField
              id="edit-show-start"
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder="Select start date and time"
            />
          )}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass} htmlFor="edit-show-end">
          End (local)
        </label>
        <Controller
          name="showEnd"
          control={control}
          render={({ field }) => (
            <DateTimeCalendarField
              id="edit-show-end"
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder="Select end date and time"
            />
          )}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Default meta</label>
        <textarea className={cn(inputClass, 'min-h-[5rem]')} rows={2} {...register('defaultMeta')} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Episode Number</label>
        <input
          className={inputClass}
          type="text"
          inputMode="numeric"
          placeholder="e.g. 12"
          {...register('episodeNumber')}
        />
        {errors.episodeNumber && (
          <span className="text-sm text-red-400">{errors.episodeNumber.message}</span>
        )}
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
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" className="rounded border-stone-600" {...register('autoplayOnStart')} />
          Autoplay on show start
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input type="checkbox" className="rounded border-stone-600" {...register('autoplayOnDate')} />
          Autoplay on calendar date
        </label>
      </div>
      <button type="submit" className={btnPrimary}>
        Save
      </button>
    </form>
  )
}
