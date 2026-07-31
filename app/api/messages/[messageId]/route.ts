import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { messageId } = await params
  await prisma.message.delete({ where: { id: messageId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const authorId = (session.user as { id?: string }).id
  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { messageId } = await params
  const { content } = await req.json().catch(() => ({}))
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const existing = await prisma.message.findUnique({ where: { id: messageId } })
  if (!existing) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // Only the author or an admin may edit a message
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin
  if (!isAdmin && existing.authorId !== authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: content.trim() },
  })
  return NextResponse.json(updated)
}
