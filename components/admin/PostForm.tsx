'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { TipTapEditor } from '@/components/TipTapEditor'

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
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 720 }}>
      <div className="form-group">
        <label>Title</label>
        <input className="form-control" {...register('title', { required: true })} />
      </div>
      <div className="form-group">
        <label>Visible to</label>
        <div>
          {VIS_OPTIONS.map((o) => (
            <label key={o.value} className="checkbox-inline" style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggleRole(o.value)}
              />{' '}
              {o.label}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Content</label>
        <Controller
          name="content"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TipTapEditor value={field.value} onChange={field.onChange} minHeight={220} />
          )}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Save
      </button>
      {postId && (
        <button type="button" className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => void onDelete()}>
          Delete
        </button>
      )}
    </form>
  )
}
