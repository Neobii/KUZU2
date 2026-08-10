import type { ReactNode } from 'react'
import { tableCellClass, tableClass, tableHeadClass } from '@/lib/ui'
import { cn } from '@/lib/cn'
import { EmptyState } from './EmptyState'

export function DataTable({
  headers,
  children,
  isEmpty,
  emptyMessage,
  emptyAction,
  className,
}: {
  headers: ReactNode[]
  children: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
  emptyAction?: ReactNode
  className?: string
}) {
  if (isEmpty) {
    return <EmptyState message={emptyMessage ?? 'Nothing here yet.'} action={emptyAction} />
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={tableClass}>
        <thead>
          <tr className={tableHeadClass}>
            {headers.map((header, i) => (
              <th key={i} className={tableCellClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function DataTableCell({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return <td className={cn(tableCellClass, className)}>{children}</td>
}
