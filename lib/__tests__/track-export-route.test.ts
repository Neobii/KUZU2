import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchLicensingExportRows: vi.fn(),
}))

vi.mock('@/lib/track-export-query', () => ({
  fetchLicensingExportRows: mocks.fetchLicensingExportRows,
}))

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(async () => ({ session: {}, userId: 'admin-1' })),
  requireAuth: vi.fn(async () => ({ session: {}, userId: 'user-1' })),
}))

import { GET } from '@/app/api/export/tracks/route'

describe('GET /api/export/tracks licensing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns preview count for station calendar dates', async () => {
    mocks.fetchLicensingExportRows.mockResolvedValue([
      {
        playDate: new Date('2026-08-13T18:53:11.340Z'),
        songTitle: 'Hot Hot Hot!!!',
        artist: 'The Cure',
        album: null,
        label: null,
        trackLength: null,
      },
    ])

    const req = new Request(
      'http://localhost/api/export/tracks?format=licensing&preview=count&dateFrom=2026-08-13&dateTo=2026-08-13'
    )
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ count: 1 })
    expect(mocks.fetchLicensingExportRows).toHaveBeenCalledWith(
      new Date('2026-08-13T05:00:00.000Z'),
      new Date('2026-08-14T05:00:00.000Z')
    )
  })

  it('returns 404 when no exportable tracks exist', async () => {
    mocks.fetchLicensingExportRows.mockResolvedValue([])

    const req = new Request(
      'http://localhost/api/export/tracks?format=licensing&dateFrom=2026-08-01&dateTo=2026-08-01'
    )
    const res = await GET(req as any)
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('No song tracks'),
    })
  })

  it('exports pipe-delimited rows when tracks exist', async () => {
    mocks.fetchLicensingExportRows.mockResolvedValue([
      {
        playDate: new Date('2026-08-13T18:53:11.340Z'),
        songTitle: 'Hot Hot Hot!!!',
        artist: 'The Cure',
        album: null,
        label: null,
        trackLength: null,
      },
    ])

    const req = new Request(
      'http://localhost/api/export/tracks?format=licensing&dateFrom=2026-08-13&dateTo=2026-08-13'
    )
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Track-Count')).toBe('1')
    const csv = await res.text()
    expect(csv.charCodeAt(0) === 0xfeff || csv.includes('Hot Hot Hot!!!')).toBe(true)
    expect(csv).toContain('Hot Hot Hot!!!')
    expect(csv).toContain('The Cure')
  })
})
