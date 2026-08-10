import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { showsListWhereForUser } from '@/lib/show-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true
  const shows = await prisma.show.findMany({
    where: showsListWhereForUser(userId, isAdmin),
    orderBy: { showStart: 'desc' },
  })
  return NextResponse.json(shows)
}
