import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    tracklist: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    show: {
      create: vi.fn(),
    },
  },
  requireSession: vi.fn(),
  requireShowAccess: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/api-auth', () => ({
  requireSession: mocks.requireSession,
}))
vi.mock('@/lib/show-access', () => ({
  requireShowAccess: mocks.requireShowAccess,
}))

import { POST } from '@/app/api/shows/[showId]/duplicate/route'

describe('POST /api/shows/[showId]/duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSession.mockResolvedValue({ userId: 'user-1' })
    mocks.requireShowAccess.mockResolvedValue({
      show: {
        id: 'show-1',
        defaultMeta: 'KUZU',
        isShowingDefaultMeta: true,
        description: 'Weekly',
        isShowingDescription: true,
        episodeNumber: 12,
        autoplayOnStart: true,
        autoplayOnDate: false,
        stopAfterLastSong: true,
        stopOnCalendarEnd: false,
        hasRadioLogikTracking: true,
        hasMessagingEnabled: true,
      },
    })
    mocks.prisma.tracklist.findMany.mockResolvedValue([])
    mocks.prisma.show.create.mockResolvedValue({ id: 'show-copy' })
  })

  it('copies Radio Logik tracking and messaging flags onto the new show', async () => {
    const req = new Request('http://localhost/api/shows/show-1/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showName: 'Episode 13' }),
    })
    const res = await POST(req as any, { params: Promise.resolve({ showId: 'show-1' }) })

    expect(res.status).toBe(200)
    expect(mocks.prisma.show.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        showName: 'Episode 13',
        autoplayOnStart: true,
        stopAfterLastSong: true,
        hasRadioLogikTracking: true,
        hasMessagingEnabled: true,
      }),
    })
  })
})
