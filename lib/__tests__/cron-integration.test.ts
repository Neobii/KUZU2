import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'http'
import 'dotenv/config'

// ── Fake Icecast servers ─────────────────────────────────────────
let icecastServer: Server
const ICECAST_PORT = 9998
const FAKE_ICECAST_URL = `http://localhost:${ICECAST_PORT}/status-json.xsl`

beforeAll(async () => {
  icecastServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ icestats: { source: { listeners: 42 } } }))
  })
  await new Promise<void>((resolve) => icecastServer.listen(ICECAST_PORT, resolve))
})

afterAll(async () => {
  await new Promise<void>((resolve) => icecastServer.close(() => resolve()))
})

// ── LISTENER_POLL_MS defaults ────────────────────────────────────
it('returns default 300000 when no env var set', async () => {
  const { getListenerPollIntervalMs } = await import('@/lib/icecast')
  delete process.env.LISTENER_POLL_MS
  expect(getListenerPollIntervalMs()).toBe(300000)
})

it('returns default 1000 for Icecast track poll when no env var set', async () => {
  const { getIcecastTrackPollIntervalMs } = await import('@/lib/icecast')
  delete process.env.ICECAST_TRACK_POLL_MS
  expect(getIcecastTrackPollIntervalMs()).toBe(1000)
})

it('respects ICECAST_TRACK_POLL_MS env var override', async () => {
  const { getIcecastTrackPollIntervalMs } = await import('@/lib/icecast')
  process.env.ICECAST_TRACK_POLL_MS = '2000'
  expect(getIcecastTrackPollIntervalMs()).toBe(2000)
  delete process.env.ICECAST_TRACK_POLL_MS
})

it('respects LISTENER_POLL_MS env var override', async () => {
  const { getListenerPollIntervalMs } = await import('@/lib/icecast')
  process.env.LISTENER_POLL_MS = '120000'
  expect(getListenerPollIntervalMs()).toBe(120000)
  delete process.env.LISTENER_POLL_MS
})

it('falls back to 300000 for invalid values', async () => {
  const { getListenerPollIntervalMs } = await import('@/lib/icecast')
  process.env.LISTENER_POLL_MS = 'not-a-number'
  expect(getListenerPollIntervalMs()).toBe(300000)
  delete process.env.LISTENER_POLL_MS
})

// ── Integration: pollListenerStats with fake Icecast ─────────────
it('fetches and parses listener stats from working Icecast', async () => {
  process.env.ICECAST_STATUS_URL = FAKE_ICECAST_URL
  const { pollListenerStats } = await import('@/lib/listeners')

  const result = await pollListenerStats()
  expect(result.numListeners).toBe(42)
  expect(result.stored).toBeTypeOf('boolean')
})

it('gracefully fails when Icecast is unreachable (connection refused)', async () => {
  process.env.ICECAST_STATUS_URL = 'http://localhost:18999/nonexistent'
  const { pollListenerStats } = await import('@/lib/listeners')

  const result = await pollListenerStats()
  expect(result.stored).toBe(false)
  expect(result.numListeners).toBeNull()
})

it('gracefully fails on invalid JSON from Icecast', async () => {
  const badJsonServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('not json')
  })
  await new Promise<void>((resolve) => badJsonServer.listen(9997, resolve))

  process.env.ICECAST_STATUS_URL = `http://localhost:9997/status-json.xsl`
  const { pollListenerStats } = await import('@/lib/listeners')
  const result = await pollListenerStats()
  expect(result.stored).toBe(false)
  expect(result.numListeners).toBeNull()

  await new Promise<void>((resolve) => badJsonServer.close(() => resolve()))
})

it('gracefully fails when Icecast returns no source data', async () => {
  const emptyServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ icestats: {} }))
  })
  await new Promise<void>((resolve) => emptyServer.listen(9996, resolve))

  process.env.ICECAST_STATUS_URL = `http://localhost:9996/status-json.xsl`
  const { pollListenerStats } = await import('@/lib/listeners')
  const result = await pollListenerStats()
  expect(result.stored).toBe(false)
  expect(result.numListeners).toBeNull()

  await new Promise<void>((resolve) => emptyServer.close(() => resolve()))
})

// ── Cron auth logic ──────────────────────────────────────────────
it('rejects requests without CRON_SECRET and without x-vercel-cron header', async () => {
  delete process.env.CRON_SECRET
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners')
  const res = await GET(req as any)
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
})

it('accepts requests with valid CRON_SECRET Bearer token', async () => {
  process.env.CRON_SECRET = 'test-cron-secret'
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  })
  const res = await GET(req as any)
  // Auth passes → handler runs → poll fails gracefully → returns 200 with stored:false
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.stored).toBe(false)
  expect(body.numListeners).toBeNull()
  delete process.env.CRON_SECRET
})

it('rejects requests with wrong CRON_SECRET', async () => {
  process.env.CRON_SECRET = 'real-secret'
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners', {
    headers: { Authorization: 'Bearer wrong-secret' },
  })
  const res = await GET(req as any)
  expect(res.status).toBe(401)
  delete process.env.CRON_SECRET
})

it('rejects spoofed x-vercel-cron when CRON_SECRET is set', async () => {
  process.env.CRON_SECRET = 'real-secret'
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners', {
    headers: { 'x-vercel-cron': '1' },
  })
  const res = await GET(req as any)
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
  delete process.env.CRON_SECRET
})

it('rejects wrong Bearer even when x-vercel-cron is present', async () => {
  process.env.CRON_SECRET = 'real-secret'
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners', {
    headers: {
      Authorization: 'Bearer wrong-secret',
      'x-vercel-cron': '1',
    },
  })
  const res = await GET(req as any)
  expect(res.status).toBe(401)
  delete process.env.CRON_SECRET
})

it('accepts x-vercel-cron when CRON_SECRET is unset', async () => {
  delete process.env.CRON_SECRET
  const { GET } = await import('@/app/api/cron/listeners/route')
  const req = new Request('http://localhost:3000/api/cron/listeners', {
    headers: { 'x-vercel-cron': '1' },
  })
  const res = await GET(req as any)
  // Auth passes → poll runs (may fail without Icecast) → not 401
  expect(res.status).not.toBe(401)
})

it('rejects unauthorized icecast track cron requests', async () => {
  delete process.env.CRON_SECRET
  const { GET } = await import('@/app/api/cron/icecast-tracks/route')
  const req = new Request('http://localhost:3000/api/cron/icecast-tracks')
  const res = await GET(req as any)
  expect(res.status).toBe(401)
})

it('accepts authorized icecast track cron requests', async () => {
  process.env.CRON_SECRET = 'test-cron-secret'
  delete process.env.VERCEL
  const { GET } = await import('@/app/api/cron/icecast-tracks/route')
  const req = new Request('http://localhost:3000/api/cron/icecast-tracks', {
    headers: { Authorization: 'Bearer test-cron-secret' },
  })
  const res = await GET(req as any)
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.polling).toBeUndefined()
  delete process.env.CRON_SECRET
})
