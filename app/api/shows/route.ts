import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin
  const where = isAdmin ? {} : { userId }
  const shows = await prisma.show.findMany({
    where,
    orderBy: { showStart: 'desc' },
  })
  return NextResponse.json(shows)
}
