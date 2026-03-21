import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const start = new Date(body.startDate)
  const end = new Date(body.endDate)
  const stats = await prisma.listenerStat.findMany({
    where: {
      fetchDate: { gte: start, lt: end },
    },
  })
  let hours = 0
  for (const s of stats) {
    hours += (5 / 60) * s.numListeners
  }
  return NextResponse.json({ hours })
}
