import { prisma } from '@/lib/prisma'
import {
  getIcecastStatusUrl,
  isIcecastAvailable,
  parseIcecastListeners,
  type IcecastStats,
} from '@/lib/icecast'

export async function pollListenerStats(): Promise<{ stored: boolean; numListeners: number | null }> {
  const url = getIcecastStatusUrl()
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return { stored: false, numListeners: null }
  }

  const data = (await res.json()) as IcecastStats
  if (!isIcecastAvailable(data)) {
    return { stored: false, numListeners: null }
  }

  const numListeners = parseIcecastListeners(data)
  if (numListeners == null) {
    return { stored: false, numListeners: null }
  }

  await prisma.listenerStat.create({ data: { numListeners } })
  return { stored: true, numListeners }
}
