import { prisma } from '@/lib/prisma'
import {
  getIcecastStatusUrl,
  isIcecastAvailable,
  parseIcecastListeners,
  type IcecastStats,
} from '@/lib/icecast'

export async function pollListenerStats(): Promise<{ stored: boolean; numListeners: number | null }> {
  let res: Response
  try {
    res = await fetch(getIcecastStatusUrl(), { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
  } catch {
    return { stored: false, numListeners: null }
  }

  if (!res.ok) {
    return { stored: false, numListeners: null }
  }

  let data: IcecastStats
  try {
    data = (await res.json()) as IcecastStats
  } catch {
    return { stored: false, numListeners: null }
  }

  if (!isIcecastAvailable(data)) {
    return { stored: false, numListeners: null }
  }

  const numListeners = parseIcecastListeners(data)
  if (numListeners == null) {
    return { stored: false, numListeners: null }
  }

  try {
    await prisma.listenerStat.create({ data: { numListeners } })
  } catch {
    return { stored: false, numListeners }
  }
  return { stored: true, numListeners }
}
