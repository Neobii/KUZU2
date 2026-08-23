import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    show: {
      findMany: vi.fn(),
    },
    user: {
      delete: vi.fn(),
    },
  },
  deleteShow: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/show-actions', () => ({ deleteShow: mocks.deleteShow }))

import { deleteUserAccount } from '@/lib/user-actions'

describe('deleteUserAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.show.findMany.mockResolvedValue([])
    mocks.prisma.user.delete.mockResolvedValue({ id: 'user-1' })
    mocks.deleteShow.mockResolvedValue(undefined)
  })

  it('tears down owned shows via deleteShow before deleting the user', async () => {
    mocks.prisma.show.findMany.mockResolvedValue([{ id: 'show-a' }, { id: 'show-b' }])

    await deleteUserAccount('user-1')

    expect(mocks.prisma.show.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true },
    })
    expect(mocks.deleteShow).toHaveBeenNthCalledWith(1, 'show-a')
    expect(mocks.deleteShow).toHaveBeenNthCalledWith(2, 'show-b')
    expect(mocks.prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    expect(mocks.deleteShow.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.prisma.user.delete.mock.invocationCallOrder[0]
    )
  })

  it('still deletes the user when they own no shows', async () => {
    await deleteUserAccount('user-2')

    expect(mocks.deleteShow).not.toHaveBeenCalled()
    expect(mocks.prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } })
  })
})
