import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifyDate } from '@/lib/utils'
import { canSeePost } from '@/lib/post-visibility'
import { HomePostsAdmin } from '@/components/HomePostsAdmin'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'asc' },
  })
  const viewer = session.user as {
    isAdmin?: boolean
    isProducer?: boolean
    producerProfile?: { isPioneer?: boolean }
  }
  const visible = posts.filter((p) => canSeePost(viewer, p.visibleBy))
  const isAdmin = !!viewer.isAdmin

  return (
    <div>
      <h2>Kuzu Updates</h2>
      {isAdmin && <HomePostsAdmin />}
      {visible.map((post) => (
        <div key={post.id}>
          <h3>
            {post.title}
            {isAdmin && (
              <span style={{ marginLeft: 12 }}>
                <a href={`/admin/posts/${post.id}/edit`} className="btn btn-xs btn-primary">
                  Edit
                </a>
              </span>
            )}
            <br />
            <small>{prettifyDate(post.postDate)}</small>
          </h3>
          <hr />
          <div
            className="form-holder"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      ))}
    </div>
  )
}
