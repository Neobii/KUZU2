import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      profile: true,
      producerProfile: true,
      isProducer: true,
      isAdmin: true,
      isBoardMember: true,
      isFieldProducer: true,
      isManagingArtists: true,
      isStudioMonitor: true,
      createdAt: true,
    },
  })
  return NextResponse.json(users)
}
