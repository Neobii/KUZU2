import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'desc' },
  })

  return (
    <div>
      <h2>Posts</h2>
      <p>
        <Link href="/admin/posts/new" className="btn btn-primary">
          New post
        </Link>
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.postDate.toISOString().slice(0, 10)}</td>
              <td>
                <Link href={`/admin/posts/${p.id}/edit`} className="btn btn-xs btn-primary">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
