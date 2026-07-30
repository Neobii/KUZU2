import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as { id?: string }).id
  if (!id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await prisma.user.update({
    where: { id },
    data: { lastActiveAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
