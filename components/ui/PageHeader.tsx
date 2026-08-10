import type { ReactNode } from 'react'
import { pageDescriptionClass, pageTitleClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function PageHeader({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={pageTitleClass}>{title}</h2>
          {description ? <p className={pageDescriptionClass}>{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}
