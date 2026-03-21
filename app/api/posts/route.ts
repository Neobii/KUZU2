import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const posts = await prisma.post.findMany({
    orderBy: { postDate: 'asc' },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const post = await prisma.post.create({
    data: {
      title: String(body.title ?? ''),
      content: String(body.content ?? ''),
      visibleBy: body.visibleBy ?? ['public'],
      postDate: body.postDate ? new Date(body.postDate) : new Date(),
    },
  })
  return NextResponse.json(post)
}
