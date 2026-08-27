import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    show: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/api-auth', () => ({
  requireSession: mocks.requireSession,
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { POST } from '@/app/api/shows/create/route'

describe('POST /api/shows/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSession.mockResolvedValue({ userId: 'user-1', session: {} })
  })

  it('rejects signed-in users who are not producers or station ops', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isAdmin: false,
      isBoardMember: false,
      isFieldProducer: false,
      isProducer: false,
      producerProfile: null,
    })

    const req = new Request('http://localhost/api/shows/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)

    expect(res.status).toBe(403)
    expect(mocks.prisma.show.create).not.toHaveBeenCalled()
  })

  it('creates a show for an evergreen producer', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isAdmin: false,
      isBoardMember: false,
      isFieldProducer: false,
      isProducer: true,
      producerProfile: {
        showName: 'Late Night',
        description: 'Beats',
        defaultMeta: 'LN',
        isMessagingUIEnabled: true,
      },
    })
    mocks.prisma.show.create.mockResolvedValue({ id: 'show-1', showName: 'Late Night' })

    const req = new Request('http://localhost/api/shows/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoplayOnStart: true }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ id: 'show-1', showName: 'Late Night' })
    expect(mocks.prisma.show.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        showName: 'Late Night',
        hasMessagingEnabled: true,
        autoplayOnStart: true,
      }),
    })
  })
})
