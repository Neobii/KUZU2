import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const list = await prisma.productionStatus.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const body = await req.json()
  const created = await prisma.productionStatus.create({
    data: {
      productionStatusName: String(body.productionStatusName ?? 'Status'),
      metaData: body.metaData ?? '',
      isShowingMetaData: Boolean(body.isShowingMetaData),
      additionalContent: body.additionalContent ?? '',
      isShowingAdditionalContent: Boolean(body.isShowingAdditionalContent),
      isActive: Boolean(body.isActive),
      producersNote: body.producersNote ?? '',
      userId: auth.userId,
    },
  })
  return NextResponse.json(created)
}
