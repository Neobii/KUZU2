import { NextResponse } from 'next/server'
import { getRadioLogikDown } from '@/lib/radio-logik'

export const dynamic = 'force-dynamic'

export async function GET() {
  const down = await getRadioLogikDown()
  return NextResponse.json({ down })
}
