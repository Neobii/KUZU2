import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import 'dotenv/config'

// Mock prisma so route tests run without a live DB connection
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findMany: vi.fn(), update: vi.fn() },
    show: { findFirst: vi.fn(), update: vi.fn() },
    message: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

// Mock getServerSession: return null (unauthenticated) by default
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
  default: {},
}))

// Mock authOptions
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})

const authedSession = (user: Record<string, unknown>) => ({
  user: { email: 'test@example.com', isAdmin: false, isProducer: false, ...user },
  expires: '2099-01-01T00:00:00.000Z',
})

// ── Auth gates (401 without session) ────────────────────────────

it('heartbeat rejects unauthenticated requests', async () => {
  const { POST } = await import('@/app/api/live/heartbeat/route')
  const res = await POST()
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
})

it('active-users rejects unauthenticated requests', async () => {
  const { GET } = await import('@/app/api/live/active-users/route')
  const res = await GET()
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
})

it('messages send rejects unauthenticated requests', async () => {
  const { POST } = await import('@/app/api/messages/send/route')
  const req = new Request('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'hello' }),
  })
  const res = await POST(req as unknown as NextRequest)
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
})

it('messages PATCH rejects unauthenticated requests', async () => {
  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/msg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'edited' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'msg-1' }),
  })
  expect(res.status).toBe(401)
  const body = await res.json()
  expect(body.error).toBe('Unauthorized')
})

// ── Authenticated request tests ─────────────────────────────────

it('messages send rejects empty content when authenticated', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'test-user', isAdmin: true }),
  )

  const { POST } = await import('@/app/api/messages/send/route')
  const req = new Request('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '' }),
  })
  const res = await POST(req as unknown as NextRequest)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toBe('Content required')
})

it('messages send returns 400 when no active show exists', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'test-user', isAdmin: true, profile: { name: 'Test Admin' } }),
  )
  // prismaMock.show.findFirst resolves undefined by default → no active show

  const { POST } = await import('@/app/api/messages/send/route')
  const req = new Request('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'hello' }),
  })
  const res = await POST(req as unknown as NextRequest)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toBe('No active show')
})

it('messages send derives showId server-side (no client showId)', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'test-user', isAdmin: true, profile: { name: 'Test Admin' } }),
  )
  prismaMock.show.findFirst.mockResolvedValue({ id: 'show-1' })
  prismaMock.message.create.mockResolvedValue({
    id: 'msg-1',
    content: 'hello board',
    showId: 'show-1',
  })

  const { POST } = await import('@/app/api/messages/send/route')
  const req = new Request('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No showId in the body — the server must derive it from the active show
    body: JSON.stringify({ content: 'hello board', targetRole: 'board' }),
  })
  const res = await POST(req as unknown as NextRequest)
  expect(res.status).toBe(200)
  expect(prismaMock.message.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ showId: 'show-1', content: 'hello board', targetRole: 'board' }),
    }),
  )
})

it('messages PATCH rejects empty content', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'test-user', isAdmin: true }),
  )

  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/msg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '   ' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'msg-1' }),
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toBe('Content required')
})

it('messages PATCH returns 404 when message does not exist', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'test-user', isAdmin: true }),
  )
  prismaMock.message.findUnique.mockResolvedValue(null)

  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/nope', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'edited' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'nope' }),
  })
  expect(res.status).toBe(404)
  const body = await res.json()
  expect(body.error).toBe('Message not found')
})

it('messages PATCH forbids non-author, non-admin users', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'other-user', isAdmin: false }),
  )
  prismaMock.message.findUnique.mockResolvedValue({
    id: 'msg-1',
    authorId: 'author-user',
    content: 'original',
  })

  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/msg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'edited' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'msg-1' }),
  })
  expect(res.status).toBe(403)
  const body = await res.json()
  expect(body.error).toBe('Forbidden')
})

it('messages PATCH updates content for admin', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'admin-user', isAdmin: true }),
  )
  prismaMock.message.findUnique.mockResolvedValue({
    id: 'msg-1',
    authorId: 'author-user',
    content: 'original',
  })
  prismaMock.message.update.mockResolvedValue({
    id: 'msg-1',
    authorId: 'author-user',
    content: 'edited text',
  })

  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/msg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '  edited text  ' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'msg-1' }),
  })
  expect(res.status).toBe(200)
  expect(prismaMock.message.update).toHaveBeenCalledWith({
    where: { id: 'msg-1' },
    data: { content: 'edited text' },
  })
})

it('messages PATCH allows the original author to edit', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'author-user', isAdmin: false }),
  )
  prismaMock.message.findUnique.mockResolvedValue({
    id: 'msg-1',
    authorId: 'author-user',
    content: 'original',
  })
  prismaMock.message.update.mockResolvedValue({
    id: 'msg-1',
    authorId: 'author-user',
    content: 'my edit',
  })

  const { PATCH } = await import('@/app/api/messages/[messageId]/route')
  const req = new Request('http://localhost:3000/api/messages/msg-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'my edit' }),
  })
  const res = await PATCH(req as unknown as NextRequest, {
    params: Promise.resolve({ messageId: 'msg-1' }),
  })
  expect(res.status).toBe(200)
  expect(prismaMock.message.update).toHaveBeenCalledWith({
    where: { id: 'msg-1' },
    data: { content: 'my edit' },
  })
})

it('heartbeat updates the channel timestamp on the active show', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'admin-user', isAdmin: true, isBoardMember: false }),
  )
  prismaMock.user.update.mockResolvedValue({ id: 'admin-user' })
  prismaMock.show.findFirst.mockResolvedValue({ id: 'show-1' })
  prismaMock.show.update.mockResolvedValue({ id: 'show-1' })

  const { POST } = await import('@/app/api/live/heartbeat/route')
  const res = await POST()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(prismaMock.user.update).toHaveBeenCalledWith({
    where: { id: 'admin-user' },
    data: { lastActiveAt: expect.any(Date) },
  })
  expect(prismaMock.show.update).toHaveBeenCalledWith({
    where: { id: 'show-1' },
    data: { adminsLastActiveAt: expect.any(Date) },
  })
})

it('active-users returns per-channel active status and member flags', async () => {
  const nextAuth = await import('next-auth')
  vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(
    authedSession({ id: 'viewer', isAdmin: true }),
  )
  const now = new Date()
  prismaMock.show.findFirst.mockResolvedValue({
    id: 'show-1',
    adminsLastActiveAt: now,
    boardLastActiveAt: null,
    studioMonitorsLastActiveAt: null,
    producersLastActiveAt: null,
  })
  prismaMock.user.findMany.mockResolvedValue([
    {
      id: 'u1',
      email: 'admin@example.com',
      profile: { name: 'Admin One' },
      isAdmin: true,
      isProducer: false,
      isBoardMember: false,
      isStudioMonitor: false,
      lastActiveAt: now,
    },
    {
      id: 'u2',
      email: 'producer@example.com',
      profile: null,
      isAdmin: false,
      isProducer: true,
      isBoardMember: false,
      isStudioMonitor: false,
      lastActiveAt: now,
    },
  ])

  const { GET } = await import('@/app/api/live/active-users/route')
  const res = await GET()
  expect(res.status).toBe(200)
  const body = await res.json()

  expect(body.users).toHaveLength(2)
  // Role flags must be exposed on each user
  expect(body.users[0]).toMatchObject({ isAdmin: true, isBoardMember: false, isStudioMonitor: false })

  const byName = (name: string) => body.channels.find((c: { name: string }) => c.name === name)
  expect(byName('admins')).toMatchObject({ active: true, activeMembers: 1 })
  expect(byName('board')).toMatchObject({ active: false, activeMembers: 0 })
  expect(byName('studioMonitors')).toMatchObject({ active: false, activeMembers: 0 })
  expect(byName('producers')).toMatchObject({ active: true, activeMembers: 1 })
  expect(byName('admins').lastActiveAt).toBeTruthy()
})

// ── Route handler structure ─────────────────────────────────────

it('heartbeat route is a POST handler', async () => {
  const { POST } = await import('@/app/api/live/heartbeat/route')
  expect(typeof POST).toBe('function')
})

it('active-users route is a GET handler', async () => {
  const { GET } = await import('@/app/api/live/active-users/route')
  expect(typeof GET).toBe('function')
})

it('messages send route is a POST handler', async () => {
  const { POST } = await import('@/app/api/messages/send/route')
  expect(typeof POST).toBe('function')
})

it('messages [messageId] route exposes PATCH and DELETE handlers', async () => {
  const mod = await import('@/app/api/messages/[messageId]/route')
  expect(typeof mod.PATCH).toBe('function')
  expect(typeof mod.DELETE).toBe('function')
})
