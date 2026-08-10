import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    productionStatus: { findFirst: vi.fn() },
    show: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import {
  getCurrentAdditionalInfo,
  hashAdditionalInfo,
} from '@/lib/tracking-additional-info'

describe('getCurrentAdditionalInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns production status additional content when enabled', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: true,
      additionalContent: '<p>Station note</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: true,
      description: 'Show description',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe('<p>Station note</p>')
  })

  it('returns show description when production content is disabled', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue({
      isShowingAdditionalContent: false,
      additionalContent: '<p>Hidden</p>',
    })
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: true,
      description: 'Live show info',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe('Live show info')
  })

  it('returns a blank string when nothing is configured', async () => {
    mocks.prisma.productionStatus.findFirst.mockResolvedValue(null)
    mocks.prisma.show.findFirst.mockResolvedValue({
      isShowingDescription: false,
      description: 'Hidden',
    })

    await expect(getCurrentAdditionalInfo()).resolves.toBe(' ')
  })
})

describe('hashAdditionalInfo', () => {
  it('returns a stable sha1 hash', () => {
    expect(hashAdditionalInfo('Live show info')).toBe(
      '50303d1d7e6849430c64786a4668303dc74fb76d'
    )
  })
})
