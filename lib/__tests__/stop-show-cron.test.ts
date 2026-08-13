import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const prisma = {
    show: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  }
  const scheduleJob = vi.fn()
  const deactivateShow = vi.fn()
  return { prisma, scheduleJob, deactivateShow }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('node-schedule', () => ({
  default: {
    scheduleJob: mocks.scheduleJob,
  },
}))
vi.mock('@/lib/show-actions', () => ({
  deactivateShow: mocks.deactivateShow,
}))
vi.mock('@/lib/icecast', () => ({ getListenerPollIntervalMs: () => 300000 }))
vi.mock('@/lib/listeners', () => ({ pollListenerStats: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.scheduleJob.mockReturnValue({ cancel: vi.fn() })
  mocks.prisma.show.updateMany.mockResolvedValue({ count: 1 })
})

describe('scheduleAutoStartShow', () => {
  it('arms only when autoStartEnd is still true (immediate path)', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      id: 'show-1',
      showStart: new Date(Date.now() + 60_000),
      autoStartEnd: true,
    })
    const { scheduleAutoStartShow } = await import('@/lib/cron')
    scheduleAutoStartShow('show-1')
    await vi.waitFor(() => {
      expect(mocks.prisma.show.updateMany).toHaveBeenCalled()
    })

    expect(mocks.prisma.show.updateMany).toHaveBeenCalledWith({
      where: { id: 'show-1', autoStartEnd: true },
      data: { isArmedForAutoStart: true },
    })
    expect(mocks.scheduleJob).not.toHaveBeenCalled()
  })

  it('re-checks autoStartEnd when a future arm job fires', async () => {
    const showStart = new Date(Date.now() + 60 * 60_000)
    const armTime = new Date(showStart.getTime() - 5 * 60_000)
    mocks.prisma.show.findUnique.mockResolvedValue({
      id: 'show-1',
      showStart,
      autoStartEnd: true,
    })
    let jobCb: (() => Promise<void>) | undefined
    mocks.scheduleJob.mockImplementation((_when, cb) => {
      jobCb = cb
      return { cancel: vi.fn() }
    })

    const { scheduleAutoStartShow } = await import('@/lib/cron')
    scheduleAutoStartShow('show-1')
    await vi.waitFor(() => {
      expect(mocks.scheduleJob).toHaveBeenCalled()
    })
    expect(mocks.scheduleJob).toHaveBeenCalledWith(armTime, expect.any(Function))

    await jobCb!()
    expect(mocks.prisma.show.updateMany).toHaveBeenCalledWith({
      where: { id: 'show-1', autoStartEnd: true },
      data: { isArmedForAutoStart: true },
    })
  })
})

describe('scheduleStopShowAtEnd', () => {
  it('does nothing when calendar stop is disabled', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      id: 'show-1',
      showEnd: new Date(Date.now() + 60_000),
      stopOnCalendarEnd: false,
      isActive: true,
    })
    const { scheduleStopShowAtEnd } = await import('@/lib/cron')
    scheduleStopShowAtEnd('show-1')
    await Promise.resolve()
    await Promise.resolve()

    expect(mocks.scheduleJob).not.toHaveBeenCalled()
    expect(mocks.deactivateShow).not.toHaveBeenCalled()
  })

  it('schedules a job for a future showEnd', async () => {
    const end = new Date(Date.now() + 120_000)
    mocks.prisma.show.findUnique.mockResolvedValue({
      id: 'show-1',
      showEnd: end,
      stopOnCalendarEnd: true,
      isActive: true,
    })
    const { scheduleStopShowAtEnd } = await import('@/lib/cron')
    scheduleStopShowAtEnd('show-1')
    await vi.waitFor(() => {
      expect(mocks.scheduleJob).toHaveBeenCalled()
    })

    expect(mocks.scheduleJob).toHaveBeenCalledWith(end, expect.any(Function))
    expect(mocks.deactivateShow).not.toHaveBeenCalled()
  })

  it('stops immediately when showEnd is already past and show is active', async () => {
    mocks.prisma.show.findUnique.mockResolvedValue({
      id: 'show-1',
      showEnd: new Date(Date.now() - 5_000),
      stopOnCalendarEnd: true,
      isActive: true,
    })
    const { scheduleStopShowAtEnd } = await import('@/lib/cron')
    scheduleStopShowAtEnd('show-1')
    await vi.waitFor(() => {
      expect(mocks.deactivateShow).toHaveBeenCalledWith('show-1')
    })
    expect(mocks.scheduleJob).not.toHaveBeenCalled()
  })
})
