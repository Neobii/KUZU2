'use client'

import useSWR from 'swr'
import { tableClass, tableCellClass, tableHeadClass } from '@/lib/ui'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AdminProducersClient() {
  const { data: users } = useSWR('/api/admin/users', fetcher)
  const producers = users?.filter((u: { isProducer?: boolean }) => u.isProducer) ?? []

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr className={tableHeadClass}>
            <th className={tableCellClass}>Email</th>
            <th className={tableCellClass}>Name</th>
            <th className={tableCellClass}>Pioneer</th>
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
                <td className={tableCellClass}>{u.email}</td>
                <td className={tableCellClass}>{u.profile?.name ?? '—'}</td>
                <td className={tableCellClass}>{u.producerProfile?.isPioneer ? 'Yes' : 'No'}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
