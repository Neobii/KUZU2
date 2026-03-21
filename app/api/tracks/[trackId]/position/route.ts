import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { incrementPosition, decrementPosition } from '@/lib/show-actions'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { trackId } = await params
  const body = await req.json()
  const dir = body.direction as 'up' | 'down'
  if (dir === 'up') await decrementPosition(trackId)
  else if (dir === 'down') await incrementPosition(trackId)
  return NextResponse.json({ ok: true })
}
