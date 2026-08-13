import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { btnPrimary, btnXsPrimary } from '@/lib/ui'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, DataTableCell } from '@/components/ui/DataTable'
import { DeletePostButton } from '@/components/admin/DeletePostButton'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'desc' },
  })

  const newPostAction = (
    <Link href="/admin/posts/new" className={cn(btnPrimary, 'no-underline')}>
      New post
    </Link>
  )

  return (
    <div>
      <PageHeader title="Posts" action={newPostAction} />
      <DataTable
        headers={['Title', 'Date', '']}
        isEmpty={posts.length === 0}
        emptyMessage="No posts yet."
        emptyAction={newPostAction}
      >
        {posts.map((p) => (
          <tr key={p.id}>
            <DataTableCell>{p.title}</DataTableCell>
            <DataTableCell>{p.postDate.toISOString().slice(0, 10)}</DataTableCell>
            <DataTableCell>
              <span className="inline-flex items-center gap-2">
                <Link
                  href={`/admin/posts/${p.id}/edit`}
                  className={cn(btnXsPrimary, 'no-underline')}
                >
                  Edit
                </Link>
                <DeletePostButton postId={p.id} title={p.title} />
              </span>
            </DataTableCell>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}
