'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { TipTapEditor } from '@/components/TipTapEditor'
import {
  btnDanger,
  btnPrimary,
  checkboxInlineClass,
  formGroupClass,
  inputClass,
  labelClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const VIS_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'pioneer', label: 'Pioneer Producers' },
  { value: 'evergreen', label: 'Evergreen Producers' },
  { value: 'public', label: 'Public' },
] as const

export type PostFormValues = {
  title: string
  content: string
  visibleBy: string[]
}

export function PostForm({
  initial,
  postId,
}: {
  initial?: PostFormValues
  postId?: string
}) {
  const router = useRouter()
  const { register, handleSubmit, control, watch, setValue } = useForm<PostFormValues>({
    defaultValues:
      initial ??
      ({
        title: '',
        content: '',
        visibleBy: ['public'],
      } as PostFormValues),
  })

  const selected = watch('visibleBy') ?? []

  function toggleRole(role: string) {
    const set = new Set(selected)
    if (set.has(role)) set.delete(role)
    else set.add(role)
    if (set.size === 0) set.add('public')
    setValue('visibleBy', Array.from(set))
  }

  async function onDelete() {
    if (!postId || !confirm('Delete this post?')) return
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/')
      router.refresh()
    }
  }

  async function onSubmit(data: PostFormValues) {
    const url = postId ? `/api/posts/${postId}` : '/api/posts'
    const method = postId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        visibleBy: data.visibleBy?.length ? data.visibleBy : ['public'],
      }),
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
      <div className={formGroupClass}>
        <label className={labelClass}>Title</label>
        <input className={inputClass} {...register('title', { required: true })} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Visible to</label>
        <div className="flex flex-wrap gap-2">
          {VIS_OPTIONS.map((o) => (
            <label key={o.value} className={cn(checkboxInlineClass, 'text-sm text-stone-300')}>
              <input
                type="checkbox"
                className="rounded border-stone-600"
                checked={selected.includes(o.value)}
                onChange={() => toggleRole(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Content</label>
        <Controller
          name="content"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TipTapEditor value={field.value} onChange={field.onChange} minHeight={220} />
          )}
        />
      </div>
      <button type="submit" className={btnPrimary}>
        Save
      </button>
      {postId && (
        <button type="button" className={cn(btnDanger, 'ml-2')} onClick={() => void onDelete()}>
          Delete
        </button>
      )}
    </form>
  )
}
