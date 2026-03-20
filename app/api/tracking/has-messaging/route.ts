import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const activeShow = await prisma.show.findFirst({
    where: { isActive: true },
  })
  if (!activeShow?.hasMessagingEnabled) {
    return NextResponse.json(false)
  }
  return NextResponse.json(true)
}
