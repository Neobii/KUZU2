import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const show = {
    id: 'show-1',
    userId: 'user-owner',
    helperUserId: 'user-helper',
  }
  const owner = {
    id: 'user-owner',
    isAdmin: false,
    isBoardMember: false,
    isFieldProducer: false,
  }
  const helper = { ...owner, id: 'user-helper' }
  const admin = {
    id: 'user-admin',
    isAdmin: true,
    isBoardMember: false,
    isFieldProducer: false,
  }
  const stranger = {
    id: 'user-stranger',
    isAdmin: false,
    isBoardMember: false,
    isFieldProducer: false,
  }
  const track = {
    id: 'track-1',
    showId: 'show-1',
    show,
  }
  const prisma = {
    show: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    tracklist: {
      findUnique: vi.fn(),
    },
  }
  return { prisma, show, owner, helper, admin, stranger, track }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isStationOps', () => {
  it('returns true for admin, board, field producer', async () => {
    const { isStationOps } = await import('@/lib/show-access')
    expect(isStationOps(mocks.admin)).toBe(true)
    expect(
      isStationOps({ isAdmin: false, isBoardMember: true, isFieldProducer: false })
    ).toBe(true)
    expect(
      isStationOps({ isAdmin: false, isBoardMember: false, isFieldProducer: true })
    ).toBe(true)
  })

  it('returns false for regular producer', async () => {
    const { isStationOps } = await import('@/lib/show-access')
    expect(isStationOps(mocks.owner)).toBe(false)
  })
})

describe('isShowMember', () => {
  it('identifies owner and helper', async () => {
    const { isShowMember } = await import('@/lib/show-access')
    expect(isShowMember('user-owner', mocks.show)).toBe(true)
    expect(isShowMember('user-helper', mocks.show)).toBe(true)
    expect(isShowMember('user-stranger', mocks.show)).toBe(false)
  })

  it('handles shows with no helper', async () => {
    const { isShowMember } = await import('@/lib/show-access')
    const soloShow = { userId: 'user-owner', helperUserId: null }
    expect(isShowMember('user-owner', soloShow)).toBe(true)
    expect(isShowMember('user-helper', soloShow)).toBe(false)
  })
})

describe('canManageShow', () => {
  it('allows owner, helper, and station ops', async () => {
    const { canManageShow } = await import('@/lib/show-access')
    expect(canManageShow(mocks.owner, mocks.show)).toBe(true)
    expect(canManageShow(mocks.helper, mocks.show)).toBe(true)
    expect(canManageShow(mocks.admin, mocks.show)).toBe(true)
  })

  it('denies strangers', async () => {
    const { canManageShow } = await import('@/lib/show-access')
    expect(canManageShow(mocks.stranger, mocks.show)).toBe(false)
  })
})

describe('canWriteProducerMessage', () => {
  it('allows station ops to write', async () => {
    const { canWriteProducerMessage } = await import('@/lib/show-access')
    expect(canWriteProducerMessage(mocks.admin, mocks.show, 'user-admin', 'hello')).toBe(
      true
    )
  })

  it('allows owner and helper to clear only', async () => {
    const { canWriteProducerMessage } = await import('@/lib/show-access')
    expect(canWriteProducerMessage(mocks.owner, mocks.show, mocks.owner.id, null)).toBe(
      true
    )
    expect(canWriteProducerMessage(mocks.helper, mocks.show, mocks.helper.id, null)).toBe(
      true
    )
    expect(
      canWriteProducerMessage(mocks.owner, mocks.show, mocks.owner.id, 'hello')
    ).toBe(false)
  })

  it('denies helper from writing a message', async () => {
    const { canWriteProducerMessage } = await import('@/lib/show-access')
    expect(
      canWriteProducerMessage(mocks.helper, mocks.show, mocks.helper.id, 'hello')
    ).toBe(false)
  })

  it('denies strangers from clearing or writing', async () => {
    const { canWriteProducerMessage } = await import('@/lib/show-access')
    expect(
      canWriteProducerMessage(mocks.stranger, mocks.show, mocks.stranger.id, null)
    ).toBe(false)
    expect(
      canWriteProducerMessage(mocks.stranger, mocks.show, mocks.stranger.id, 'hello')
    ).toBe(false)
  })
})

describe('requireShowAccess', () => {
  it('returns show and user for the owner', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)

    const { requireShowAccess } = await import('@/lib/show-access')
    const result = await requireShowAccess('show-1', 'user-owner')

    expect(result).toEqual({ show: mocks.show, user: mocks.owner })
    expect('error' in result).toBe(false)
  })

  it('allows helper and admin', async () => {
    const { requireShowAccess } = await import('@/lib/show-access')

    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.helper)
    expect('error' in (await requireShowAccess('show-1', 'user-helper'))).toBe(false)

    mocks.prisma.user.findUnique.mockResolvedValue(mocks.admin)
    expect('error' in (await requireShowAccess('show-1', 'user-admin'))).toBe(false)
  })

  it('returns 404 when show is missing', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue(null)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)

    const { requireShowAccess } = await import('@/lib/show-access')
    const result = await requireShowAccess('missing', 'user-owner')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(404)
      await expect(result.error.json()).resolves.toEqual({ error: 'Not found' })
    }
  })

  it('returns 401 when user is missing', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(null)

    const { requireShowAccess } = await import('@/lib/show-access')
    const result = await requireShowAccess('show-1', 'missing-user')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(401)
    }
  })

  it('returns 403 for a stranger', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.stranger)

    const { requireShowAccess } = await import('@/lib/show-access')
    const result = await requireShowAccess('show-1', 'user-stranger')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
      await expect(result.error.json()).resolves.toEqual({ error: 'Forbidden' })
    }
  })
})

describe('requireTrackAccess', () => {
  it('returns track, show, and user when authorized', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue(mocks.track)
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)

    const { requireTrackAccess } = await import('@/lib/show-access')
    const result = await requireTrackAccess('track-1', 'user-owner')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.track.id).toBe('track-1')
      expect(result.show.id).toBe('show-1')
      expect(result.user.id).toBe('user-owner')
    }
  })

  it('returns 404 when track is missing', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue(null)

    const { requireTrackAccess } = await import('@/lib/show-access')
    const result = await requireTrackAccess('missing', 'user-owner')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(404)
    }
  })

  it('returns 403 for orphan tracks with no show', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue({
      id: 'track-orphan',
      showId: null,
      show: null,
    })

    const { requireTrackAccess } = await import('@/lib/show-access')
    const result = await requireTrackAccess('track-orphan', 'user-owner')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
    }
  })

  it('returns 403 when user cannot manage the parent show', async () => {
    mocks.prisma.tracklist.findUnique.mockResolvedValue(mocks.track)
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.stranger)

    const { requireTrackAccess } = await import('@/lib/show-access')
    const result = await requireTrackAccess('track-1', 'user-stranger')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
    }
  })
})

describe('requireLiveShowControl', () => {
  it('allows owner of the active show', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)
    mocks.prisma.show.findFirst.mockResolvedValue({
      ...mocks.show,
      isActive: true,
    })

    const { requireLiveShowControl } = await import('@/lib/show-access')
    const result = await requireLiveShowControl('user-owner')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.active?.id).toBe('show-1')
      expect(result.canView).toBe(true)
    }
  })

  it('allows station ops for any active show', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.admin)
    mocks.prisma.show.findFirst.mockResolvedValue({
      ...mocks.show,
      isActive: true,
    })

    const { requireLiveShowControl } = await import('@/lib/show-access')
    const result = await requireLiveShowControl('user-admin')

    expect('error' in result).toBe(false)
  })

  it('returns 403 when no show is active', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.admin)
    mocks.prisma.show.findFirst.mockResolvedValue(null)

    const { requireLiveShowControl } = await import('@/lib/show-access')
    const result = await requireLiveShowControl('user-admin')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
    }
  })

  it('returns 403 for a stranger when another show is live', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.stranger)
    mocks.prisma.show.findFirst.mockResolvedValue({
      ...mocks.show,
      isActive: true,
    })

    const { requireLiveShowControl } = await import('@/lib/show-access')
    const result = await requireLiveShowControl('user-stranger')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
    }
  })
})

describe('requireLiveTrackStart', () => {
  it('allows starting a track on the active show', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)
    mocks.prisma.show.findFirst.mockResolvedValue({
      ...mocks.show,
      isActive: true,
    })
    mocks.prisma.tracklist.findUnique.mockResolvedValue(mocks.track)
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)

    const { requireLiveTrackStart } = await import('@/lib/show-access')
    const result = await requireLiveTrackStart('track-1', 'user-owner')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.track.id).toBe('track-1')
      expect(result.active.id).toBe('show-1')
    }
  })

  it('returns 403 when the track belongs to a different show than the live one', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.admin)
    mocks.prisma.show.findFirst.mockResolvedValue({
      id: 'show-live',
      userId: 'user-other',
      helperUserId: null,
      isActive: true,
    })
    mocks.prisma.tracklist.findUnique.mockResolvedValue(mocks.track)
    mocks.prisma.show.findUnique.mockResolvedValue(mocks.show)

    const { requireLiveTrackStart } = await import('@/lib/show-access')
    const result = await requireLiveTrackStart('track-1', 'user-admin')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
      await expect(result.error.json()).resolves.toEqual({ error: 'Forbidden' })
    }
  })

  it('returns 403 when no show is live', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(mocks.owner)
    mocks.prisma.show.findFirst.mockResolvedValue(null)

    const { requireLiveTrackStart } = await import('@/lib/show-access')
    const result = await requireLiveTrackStart('track-1', 'user-owner')

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(403)
    }
  })
})
