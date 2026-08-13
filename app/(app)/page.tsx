import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifyDate } from '@/lib/utils'
import { canSeePost } from '@/lib/post-visibility'
import { DeletePostButton } from '@/components/admin/DeletePostButton'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'desc' },
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
      <h2 className="mb-4 text-xl font-semibold text-stone-100">Kuzu Updates</h2>
      {visible.length === 0 && (
        <div className="mt-4 rounded-lg border border-stone-700 bg-stone-900/40 p-4 text-stone-400">
          <p className="mb-0 text-sm">
            No updates to show yet.
          </p>
        </div>
      )}
      {visible.map((post) => (
        <div key={post.id} className="mb-8">
          <h3 className="text-lg font-medium text-stone-100">
            {post.title}
            {isAdmin && (
              <span className="ml-3 inline-flex items-center gap-2">
                <a
                  href={`/admin/posts/${post.id}/edit`}
                  className="inline-flex rounded-md bg-amber-600 px-2 py-0.5 text-xs font-medium text-white no-underline hover:bg-amber-700"
                >
                  Edit
                </a>
                <DeletePostButton postId={post.id} title={post.title} />
              </span>
            )}
            <br />
            <span className="text-sm font-normal text-stone-500">{prettifyDate(post.postDate)}</span>
          </h3>
          <hr className="my-3 border-stone-700" />
          <div
            className="form-holder"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      ))}
    </div>
  )
}
