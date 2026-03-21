import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { postId } = await params
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { postId } = await params
  const body = await req.json()
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(body.title != null && { title: String(body.title) }),
      ...(body.content != null && { content: String(body.content) }),
      ...(body.visibleBy != null && { visibleBy: body.visibleBy }),
      ...(body.postDate != null && { postDate: new Date(body.postDate) }),
    },
  })
  return NextResponse.json(post)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { postId } = await params
  await prisma.post.delete({ where: { id: postId } })
  return NextResponse.json({ ok: true })
}
