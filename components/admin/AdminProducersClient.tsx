'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AdminProducersClient() {
  const { data: users } = useSWR('/api/admin/users', fetcher)
  const producers = users?.filter((u: { isProducer?: boolean }) => u.isProducer) ?? []

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Pioneer</th>
        </tr>
      </thead>
      <tbody>
        {producers.map(
          (u: {
            id: string
            email: string
            profile: { name?: string } | null
            producerProfile: { isPioneer?: boolean } | null
          }) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.profile?.name ?? '—'}</td>
              <td>{u.producerProfile?.isPioneer ? 'Yes' : 'No'}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  )
}
