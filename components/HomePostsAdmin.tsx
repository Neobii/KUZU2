'use client'

import Link from 'next/link'

export function HomePostsAdmin() {
  return (
    <div className="well well-sm" style={{ marginBottom: 16 }}>
      <p className="small text-muted" style={{ marginBottom: 8 }}>
        <strong>Admin:</strong> posts use TipTap at <code>/admin/posts/new</code> and{' '}
        <code>/admin/posts/[id]/edit</code>.
      </p>
      <p>
        <Link href="/admin/posts/new" className="btn btn-primary btn-sm">
          New post
        </Link>{' '}
        <Link href="/admin/posts" className="btn btn-default btn-sm">
          Manage posts
        </Link>{' '}
        <a href="/api/export/tracks" className="btn btn-default btn-sm" download>
          Export all tracks (CSV)
        </a>
      </p>
      <p className="small text-muted" style={{ marginBottom: 0 }}>
        Date range export:{' '}
        <code>/api/export/tracks?dateFrom=ISO&amp;dateTo=ISO</code> (semicolon-delimited). Per-show
        TSV: <code>/api/export/shows/[showId]/tracks</code> (also from Admin → Shows).
      </p>
    </div>
  )
}
