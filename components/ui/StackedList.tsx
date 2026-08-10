import { Children, type ReactNode } from 'react'
import Link from 'next/link'
import { listItemClass, listStackClass } from '@/lib/ui'
import { cn } from '@/lib/cn'
import { EmptyState } from './EmptyState'

export function StackedList({
  children,
  emptyMessage,
  emptyAction,
  className,
}: {
  children: ReactNode
  emptyMessage?: string
  emptyAction?: ReactNode
  className?: string
}) {
  const items = Children.toArray(children)

  if (items.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Nothing here yet.'} action={emptyAction} />
  }

  return <div className={cn(listStackClass, className)}>{children}</div>
}

export function StackedListItem({
  title,
  href,
  meta,
  subtitle,
  actions,
  children,
  className,
}: {
  title: ReactNode
  href?: string
  meta?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const titleNode =
    href != null ? (
      <Link href={href} className="font-medium text-amber-400 no-underline hover:text-amber-300">
        {title}
      </Link>
    ) : (
      <span className="font-medium text-stone-100">{title}</span>
    )

  return (
    <div className={cn(listItemClass, className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0 text-base">{titleNode}</div>
        {meta ? <div className="shrink-0 text-sm text-stone-400">{meta}</div> : null}
      </div>
      {subtitle ? <div className="mt-1 text-sm text-stone-400">{subtitle}</div> : null}
      {children ? <div className="mt-2 text-sm text-stone-400">{children}</div> : null}
      {actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
