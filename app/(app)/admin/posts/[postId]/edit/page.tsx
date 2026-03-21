import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PostForm } from '@/components/admin/PostForm'

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) notFound()
  const visibleBy = (post.visibleBy as string[] | null) ?? ['public']

  return (
    <div>
      <h2>Edit post</h2>
      <PostForm
        postId={post.id}
        initial={{
          title: post.title,
          content: post.content,
          visibleBy,
        }}
      />
    </div>
  )
}
