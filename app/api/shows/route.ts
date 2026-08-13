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
  const user = session.user as {
    id?: string
    isAdmin?: boolean
    isBoardMember?: boolean
    isFieldProducer?: boolean
  }
  const shows = await prisma.show.findMany({
    where: showsListWhereForUser(user.id, {
      isAdmin: user.isAdmin === true,
      isBoardMember: user.isBoardMember === true,
      isFieldProducer: user.isFieldProducer === true,
    }),
    orderBy: { showStart: 'desc' },
  })
  return NextResponse.json(shows)
}
