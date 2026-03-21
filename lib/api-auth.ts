import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const id = (session.user as { id?: string }).id
  if (!id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, userId: id }
}

export async function canAccessLiveShow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.isAdmin) return true
  const active = await prisma.show.findFirst({ where: { isActive: true } })
  if (!active) return false
  return active.userId === userId || active.helperUserId === userId
}
