import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { btnPrimary, btnXsPrimary, tableClass, tableCellClass, tableHeadClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'desc' },
  })

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-stone-100">Posts</h2>
      <p className="mb-4">
        <Link href="/admin/posts/new" className={cn(btnPrimary, 'no-underline')}>
          New post
        </Link>
      </p>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Title</th>
              <th className={tableCellClass}>Date</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className={tableCellClass}>{p.title}</td>
                <td className={tableCellClass}>{p.postDate.toISOString().slice(0, 10)}</td>
                <td className={tableCellClass}>
                  <Link href={`/admin/posts/${p.id}/edit`} className={cn(btnXsPrimary, 'no-underline')}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
