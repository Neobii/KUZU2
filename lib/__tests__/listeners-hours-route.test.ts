import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireStatsAccess: vi.fn(),
  findMany: vi.fn(),
  getListenerPollIntervalMs: vi.fn(() => 300_000),
}))

vi.mock('@/lib/require-admin', () => ({
  requireStatsAccess: mocks.requireStatsAccess,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    listenerStat: {
      findMany: mocks.findMany,
    },
  },
}))

vi.mock('@/lib/icecast', () => ({
  getListenerPollIntervalMs: mocks.getListenerPollIntervalMs,
}))

import { POST } from '@/app/api/listeners/hours/route'

describe('POST /api/listeners/hours', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStatsAccess.mockResolvedValue({ userId: 'admin-1' })
    mocks.findMany.mockResolvedValue([{ numListeners: 12 }])
    mocks.getListenerPollIntervalMs.mockReturnValue(300_000)
  })

  it('queries America/Chicago calendar-day bounds, not server-local midnight', async () => {
    const req = new NextRequest('http://localhost/api/listeners/hours', {
      method: 'POST',
      body: JSON.stringify({ startDate: '2026-08-13', endDate: '2026-08-13' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        fetchDate: {
          gte: new Date('2026-08-13T05:00:00.000Z'),
          lt: new Date('2026-08-14T05:00:00.000Z'),
        },
      },
    })

    const body = await res.json()
    // 12 listeners * (300000ms / 3600000) = 1 hour
    expect(body.hours).toBe(1)
  })

  it('includes an evening Central poll in a same-day range that UTC midnight would miss', async () => {
    const eveningCentral = new Date('2026-08-14T02:30:00.000Z') // Aug 13 9:30 PM CDT
    mocks.findMany.mockImplementation(async ({ where }) => {
      const gte = where.fetchDate.gte as Date
      const lt = where.fetchDate.lt as Date
      if (eveningCentral >= gte && eveningCentral < lt) {
        return [{ numListeners: 24 }]
      }
      return []
    })

    const req = new NextRequest('http://localhost/api/listeners/hours', {
      method: 'POST',
      body: JSON.stringify({ startDate: '2026-08-13', endDate: '2026-08-13' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const body = await res.json()
    expect(body.hours).toBe(2)
  })
})
