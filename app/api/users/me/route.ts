import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      profile: true,
      producerProfile: true,
      isProducer: true,
      isAdmin: true,
    },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const current = await prisma.user.findUnique({ where: { id: auth.userId } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = {
    ...((current.profile as object) ?? {}),
    ...(body.profile && typeof body.profile === 'object' ? body.profile : {}),
  }
  const producerProfile = {
    ...((current.producerProfile as object) ?? {}),
    ...(body.producerProfile && typeof body.producerProfile === 'object'
      ? body.producerProfile
      : {}),
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      profile: Object.keys(profile).length ? profile : undefined,
      producerProfile: Object.keys(producerProfile).length ? producerProfile : undefined,
      ...(body.isProducer !== undefined && { isProducer: Boolean(body.isProducer) }),
    },
    select: {
      id: true,
      email: true,
      profile: true,
      producerProfile: true,
      isProducer: true,
      isAdmin: true,
    },
  })
  return NextResponse.json(updated)
}
