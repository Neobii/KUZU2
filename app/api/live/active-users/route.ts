import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const since = new Date(Date.now() - 60_000) // active within last 60s
  const users = await prisma.user.findMany({
    where: {
      lastActiveAt: { gte: since },
    },
    select: {
      id: true,
      email: true,
      profile: true,
      isAdmin: true,
      isProducer: true,
      lastActiveAt: true,
    },
    orderBy: { lastActiveAt: 'desc' },
  })
  return NextResponse.json(users)
}
