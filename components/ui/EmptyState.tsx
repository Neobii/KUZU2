import type { ReactNode } from 'react'
import { emptyStateClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function EmptyState({
  message,
  action,
  className,
}: {
  message: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn(emptyStateClass, className)}>
      <p>{message}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  )
}
