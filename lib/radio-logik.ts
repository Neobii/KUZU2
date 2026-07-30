import {
  getIcecastStatusUrl,
  isIcecastAvailable,
  type IcecastStats,
} from '@/lib/icecast'

let cachedDown = false
let lastCheck = 0
const CACHE_MS = 5000

export async function getRadioLogikDown(): Promise<boolean> {
  const now = Date.now()
  if (now - lastCheck < CACHE_MS) return cachedDown
  lastCheck = now
  const url = getIcecastStatusUrl()
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) {
      cachedDown = true
      return true
    }
    const data = (await res.json()) as IcecastStats
    if (!isIcecastAvailable(data)) {
      cachedDown = true
      return true
    }
    cachedDown = false
    return false
  } catch {
    cachedDown = true
    return true
  }
}
