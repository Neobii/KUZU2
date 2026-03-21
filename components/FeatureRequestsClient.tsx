'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
      <h2>Feature Requests</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 480, marginBottom: 24 }}>
        <div className="form-group">
          <label>Name</label>
          <input className="form-control" {...register('name')} />
          {errors.name && <span className="text-danger">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" rows={3} {...register('description')} />
        </div>
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Name</th>
            <th>Description</th>
            <th />
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
                <td>{f.totalScore}</td>
                <td>{f.name}</td>
                <td>{f.description}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-xs btn-success"
                    onClick={() => void vote(f.id, 'up')}
                  >
                    +
                  </button>{' '}
                  <button
                    type="button"
                    className="btn btn-xs btn-danger"
                    onClick={() => void vote(f.id, 'down')}
                  >
                    −
                  </button>
                  {session?.user?.isAdmin && (
                    <button
                      type="button"
                      className="btn btn-xs btn-warning"
                      onClick={() => void remove(f.id)}
                    >
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
  )
}
