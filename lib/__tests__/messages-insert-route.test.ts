import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: {
      findFirst: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { POST } from '@/app/api/messages/insert/route'

describe('POST /api/messages/insert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects when no show is live', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue(null)

    const req = new Request('http://localhost/api/messages/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody: 'hello', sentBy: 'listener' }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ ok: false })
    expect(mocks.prisma.message.create).not.toHaveBeenCalled()
  })

  it('rejects when the live show has messaging disabled', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      userId: 'producer-1',
      isActive: true,
      hasMessagingEnabled: false,
    })

    const req = new Request('http://localhost/api/messages/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody: 'spam', sentBy: 'attacker' }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ ok: false })
    expect(mocks.prisma.message.create).not.toHaveBeenCalled()
  })

  it('creates a message when the live show has messaging enabled', async () => {
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-1',
      userId: 'producer-1',
      isActive: true,
      hasMessagingEnabled: true,
    })
    mocks.prisma.message.create.mockResolvedValue({ id: 'msg-1' })

    const req = new Request('http://localhost/api/messages/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageBody: 'great set', sentBy: 'listener' }),
    })
    const res = await POST(req as any)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(mocks.prisma.message.create).toHaveBeenCalledWith({
      data: {
        content: 'great set',
        sentBy: 'listener',
        showId: 'show-1',
        producerId: 'producer-1',
      },
    })
  })
})
