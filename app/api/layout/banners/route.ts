import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessLiveShow } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({})
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({})
  const armedShow = await prisma.show.findFirst({
    where: { isArmedForAutoStart: true },
  })
  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
  })
  const canLookAtLiveShow = await canAccessLiveShow(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const isAdmin = user?.isAdmin
  const canSeeBanner =
    !!activeShow &&
    (isAdmin ||
      activeShow.userId === userId ||
      activeShow.helperUserId === userId)

  return NextResponse.json({
    armedShow,
    activeShow,
    canLookAtLiveShow,
    canSeeBanner,
  })
}
