import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prettifyDate } from '@/lib/utils'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'asc' },
  })

  return (
    <div>
      <h2>Kuzu Updates</h2>
      {posts.map((post) => (
        <div key={post.id}>
          <h3>
            {post.title}
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
