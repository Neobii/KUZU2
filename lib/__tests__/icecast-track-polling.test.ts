import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  pollIcecastTrackLog: vi.fn().mockResolvedValue({ trackStored: false, track: null }),
  pollListenerCount: vi.fn(),
  prisma: {
    show: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('node-schedule', () => ({
  default: { scheduleJob: vi.fn() },
}))
vi.mock('@/lib/icecast', () => ({
  getListenerPollIntervalMs: () => 300000,
  getIcecastTrackPollIntervalMs: () => 1000,
}))
vi.mock('@/lib/listeners', () => ({
  pollListenerCount: mocks.pollListenerCount,
  pollIcecastTrackLog: mocks.pollIcecastTrackLog,
}))

import {
  holdIcecastTrackPolling,
  startIcecastTrackPolling,
  startListenerPolling,
  stopIcecastTrackPolling,
  stopListenerPolling,
} from '@/lib/cron'

afterEach(() => {
  stopListenerPolling()
  vi.useRealTimers()
  delete process.env.VERCEL
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('startIcecastTrackPolling', () => {
  it('polls immediately and again every second', async () => {
    vi.useFakeTimers()
    startIcecastTrackPolling()
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(3)
  })

  it('does not start a second interval', async () => {
    vi.useFakeTimers()
    startIcecastTrackPolling()
    startIcecastTrackPolling()
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(2)
  })

  it('stopIcecastTrackPolling clears the timer', async () => {
    vi.useFakeTimers()
    startIcecastTrackPolling()
    stopIcecastTrackPolling()
    await vi.advanceTimersByTimeAsync(5000)
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(1)
  })
})

describe('holdIcecastTrackPolling', () => {
  it('starts the interval and resolves after holdMs', async () => {
    vi.useFakeTimers()
    const held = holdIcecastTrackPolling(2000)
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2000)
    await held
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(3)
  })
})

describe('startListenerPolling', () => {
  it('starts the Icecast interval off Vercel (local)', () => {
    vi.useFakeTimers()
    delete process.env.VERCEL
    startListenerPolling()
    expect(mocks.pollIcecastTrackLog).toHaveBeenCalledTimes(1)
  })

  it('does not start the Icecast interval on Vercel', () => {
    vi.useFakeTimers()
    process.env.VERCEL = '1'
    startListenerPolling()
    expect(mocks.pollIcecastTrackLog).not.toHaveBeenCalled()
  })
})
