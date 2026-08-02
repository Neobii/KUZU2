import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const search = (request.nextUrl.searchParams.get('search') ?? '').trim()
  const artists = search
    ? await prisma.artist.findMany({
        where: { artistName: { contains: search, mode: 'insensitive' } },
        take: 10,
        orderBy: { artistName: 'asc' },
      })
    : []
  return NextResponse.json({ artists })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const artistName = typeof body.artistName === 'string' ? body.artistName.trim() : ''
  if (!artistName) {
    return NextResponse.json({ error: 'artistName is required' }, { status: 400 })
  }
  const artist = await prisma.artist.upsert({
    where: { artistName },
    update: {},
    create: { artistName },
  })
  return NextResponse.json({ artist }, { status: 201 })
}
