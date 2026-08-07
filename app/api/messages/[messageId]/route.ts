import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/api-auth'
import { requireShowAccess } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const auth = await requireSession()
  if ('error' in auth) return auth.error

  const { messageId } = await params
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!message.showId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await requireShowAccess(message.showId, auth.userId)
  if ('error' in access) return access.error

  await prisma.message.delete({ where: { id: messageId } })
  return NextResponse.json({ ok: true })
}
