import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await req.json()
  const updated = await prisma.autoDJPlaylist.update({
    where: { id },
    data: {
      ...(body.name != null && { name: String(body.name) }),
      ...(body.showSchedules != null && { showSchedules: body.showSchedules }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { id } = await params
  await prisma.autoDJPlaylist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
