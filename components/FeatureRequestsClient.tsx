'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  btnPrimary,
  btnXsDanger,
  btnXsSuccess,
  btnXsWarning,
  formGroupClass,
  inputClass,
  labelClass,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FeatureRequestsClient() {
  const { data: session } = useSession()
  const { data: items, mutate } = useSWR('/api/features', fetcher)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      reset()
      void mutate()
    }
  }

  async function vote(id: string, direction: 'up' | 'down') {
    await fetch(`/api/features/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    })
    void mutate()
  }

  async function remove(id: string) {
    if (!confirm('Delete?')) return
    await fetch(`/api/features/${id}`, { method: 'DELETE' })
    void mutate()
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-stone-100">Feature Requests</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 max-w-md">
        <div className={formGroupClass}>
          <label className={labelClass}>Name</label>
          <input className={inputClass} {...register('name')} />
          {errors.name && <span className="text-sm text-red-400">{errors.name.message}</span>}
        </div>
        <div className={formGroupClass}>
          <label className={labelClass}>Description</label>
          <textarea className={cn(inputClass, 'min-h-[5rem]')} rows={3} {...register('description')} />
        </div>
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Score</th>
              <th className={tableCellClass}>Name</th>
              <th className={tableCellClass}>Description</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {items?.map(
              (f: {
                id: string
                name: string
                description: string
                totalScore: number
                userVotesUp: string[] | null
                userVotesDown: string[] | null
              }) => (
                <tr key={f.id}>
                  <td className={tableCellClass}>{f.totalScore}</td>
                  <td className={tableCellClass}>{f.name}</td>
                  <td className={tableCellClass}>{f.description}</td>
                  <td className={tableCellClass}>
                    <button type="button" className={btnXsSuccess} onClick={() => void vote(f.id, 'up')}>
                      +
                    </button>{' '}
                    <button type="button" className={btnXsDanger} onClick={() => void vote(f.id, 'down')}>
                      −
                    </button>
                    {session?.user?.isAdmin && (
                      <button type="button" className={cn(btnXsWarning, 'ml-1')} onClick={() => void remove(f.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
