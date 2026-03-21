import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { featureId } = await params
  const body = await req.json()
  const direction = body.direction as 'up' | 'down'
  const f = await prisma.featureRequest.findUnique({ where: { id: featureId } })
  if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const up = (f.userVotesUp as string[] | null) ?? []
  const down = (f.userVotesDown as string[] | null) ?? []
  let nextUp = [...up]
  let nextDown = [...down]
  nextUp = nextUp.filter((id) => id !== userId)
  nextDown = nextDown.filter((id) => id !== userId)
  if (direction === 'up') nextUp.push(userId)
  else nextDown.push(userId)
  const totalScore = nextUp.length - nextDown.length
  const updated = await prisma.featureRequest.update({
    where: { id: featureId },
    data: {
      userVotesUp: nextUp,
      userVotesDown: nextDown,
      totalScore,
    },
  })
  return NextResponse.json(updated)
}
