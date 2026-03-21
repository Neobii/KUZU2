'use client'

import Link from 'next/link'
import { btnPrimary, btnSecondary, wellClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function HomePostsAdmin() {
  return (
    <div className={cn(wellClass, 'mb-4')}>
      <p className="mb-2 text-sm text-stone-400">
        <strong className="text-stone-200">Admin:</strong> posts use TipTap at <code className="text-amber-300">/admin/posts/new</code> and{' '}
        <code className="text-amber-300">/admin/posts/[id]/edit</code>.
      </p>
      <p className="mb-2 flex flex-wrap gap-2">
        <Link href="/admin/posts/new" className={cn(btnPrimary, 'no-underline')}>
          New post
        </Link>
        <Link href="/admin/posts" className={cn(btnSecondary, 'no-underline')}>
          Manage posts
        </Link>
        <a href="/api/export/tracks" className={cn(btnSecondary, 'no-underline')} download>
          Export all tracks (CSV)
        </a>
      </p>
      <p className="mb-0 text-xs text-stone-500">
        Date range export:{' '}
        <code className="text-stone-400">/api/export/tracks?dateFrom=ISO&amp;dateTo=ISO</code> (semicolon-delimited). Per-show
        TSV: <code className="text-stone-400">/api/export/shows/[showId]/tracks</code> (also from Admin → Shows).
      </p>
    </div>
  )
}
