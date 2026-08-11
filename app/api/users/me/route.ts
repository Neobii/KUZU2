import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-admin'
import {
  sanitizeSelfServiceUserPatch,
  selfServicePatchHasUpdates,
} from '@/lib/self-service-user-patch'

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

  const patch = sanitizeSelfServiceUserPatch(current, body)
  if (!selfServicePatchHasUpdates(patch)) {
    return NextResponse.json(
      { error: 'No allowed profile fields to update' },
      { status: 400 }
    )
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(patch.profile !== undefined && { profile: patch.profile }),
      ...(patch.producerProfile !== undefined && {
        producerProfile: patch.producerProfile,
      }),
      ...(patch.isProducer !== undefined && { isProducer: patch.isProducer }),
      ...(patch.isAdmin !== undefined && { isAdmin: patch.isAdmin }),
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
