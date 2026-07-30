'use client'

import useSWR from 'swr'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { prettifySimpleTime } from '@/lib/utils-client'
import {
  btnPrimary,
  btnDanger,
  btnXsDanger,
  inputClass,
  tableClass,
  tableHeadClass,
  tableCellClass,
  panelClass,
  panelHeadingClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed')
    return r.json()
  })

type Message = {
  id: string
  content: string
  sentBy: string | null
  sentAt: string
  isRead: boolean
  targetRole: string
}

type ActiveUser = {
  id: string
  email: string
  profile: { name?: string } | null
  isAdmin: boolean
  isProducer: boolean
  isBoard: boolean
  isStudioMonitor: boolean
  lastActiveAt: string
}

const roleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Admin',
    producer: 'Producer',
    board: 'Board',
    studio_monitor: 'Studio Monitor',
    all: 'Everyone',
  }
  return labels[role] ?? role
}

const roleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-amber-600/80 text-white',
    producer: 'bg-emerald-600/80 text-white',
    board: 'bg-blue-600/80 text-white',
    studio_monitor: 'bg-purple-600/80 text-white',
    all: 'bg-stone-600/80 text-white',
  }
  return colors[role] ?? 'bg-stone-600/80 text-white'
}

export function AdminLiveChat() {
  const { data: session } = useSession()
  const [msgText, setMsgText] = useState('')
  const [targetRole, setTargetRole] = useState('producer')
  const [sending, setSending] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  // Heartbeat every 10s while page is open
  useEffect(() => {
    const hb = setInterval(() => {
      fetch('/api/live/heartbeat', { method: 'POST' }).catch(() => {})
    }, 10_000)
    fetch('/api/live/heartbeat', { method: 'POST' }).catch(() => {})
    return () => clearInterval(hb)
  }, [])

  // Fetch active show messages every 5s
  const {
    data: messages,
    error: msgErr,
    mutate: mutateMsg,
  } = useSWR<Message[]>('/api/messages/active-show', fetcher, {
    refreshInterval: 5000,
  })

  // Fetch active users every 10s
  const { data: activeUsers } = useSWR<ActiveUser[]>('/api/live/active-users', fetcher, {
    refreshInterval: 10_000,
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark all as read when viewing
  useEffect(() => {
    fetch('/api/messages/mark-show-read', { method: 'POST' }).catch(() => {})
  }, [])

  const sendMessage = useCallback(async () => {
    const text = msgText.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, targetRole }),
      })
      if (res.ok) {
        setMsgText('')
        void mutateMsg()
      }
    } finally {
      setSending(false)
    }
  }, [msgText, sending, mutateMsg, targetRole])

  const deleteMessage = useCallback(
    async (id: string) => {
      await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      void mutateMsg()
    },
    [mutateMsg],
  )

  const isAdmin = session?.user?.isAdmin

  return (
    <div className="flex gap-4">
      {/* Main chat panel */}
      <div className="flex-1">
        <div className={panelClass}>
          <h3 className={panelHeadingClass}>Live Show Chat</h3>

          {msgErr && (
            <p className="mb-3 text-sm text-red-400">No active show. Messages will appear when a show is live.</p>
          )}

          {/* Messages list */}
          <div className="mb-4 max-h-[60vh] min-h-[300px] overflow-y-auto rounded border border-stone-700 bg-stone-950/50 p-3">
            {!messages || messages.length === 0 ? (
              <p className="text-sm text-stone-500">No messages yet.</p>
            ) : (
              [...messages].reverse().map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'mb-2 rounded p-2',
                    m.sentBy?.toLowerCase().includes('producer')
                      ? 'ml-8 border-l-4 border-emerald-600 bg-stone-800/60'
                      : 'mr-8 border-l-4 border-amber-600 bg-stone-800/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-100">{m.content}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {m.sentBy ?? 'Unknown'} · {prettifySimpleTime(m.sentAt)}
                      </p>
                      <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', roleBadgeColor(m.targetRole))}>
                        To: {roleLabel(m.targetRole)}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        className={cn(btnXsDanger, 'shrink-0')}
                        onClick={() => deleteMessage(m.id)}
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Send message */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage()
            }}
            className="flex flex-wrap gap-2"
          >
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="rounded border border-stone-600 bg-stone-800 px-2 py-2 text-sm text-white"
            >
              <option value="producer">To Producers</option>
              <option value="board">To Board</option>
              <option value="admin">To Admins</option>
              <option value="studio_monitor">To Studio Monitors</option>
              <option value="all">To Everyone</option>
            </select>
            <input
              type="text"
              className={cn(inputClass, 'min-w-[200px] flex-1')}
              placeholder="Type a message…"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={!!msgErr}
            />
            <button type="submit" className={btnPrimary} disabled={sending || !msgText.trim() || !!msgErr}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Active users sidebar */}
      <div className="w-64 shrink-0">
        <div className={panelClass}>
          <h4 className={panelHeadingClass}>
            Online{' '}
            <span className="text-sm font-normal text-stone-400">
              ({activeUsers?.length ?? 0})
            </span>
          </h4>
          {!activeUsers || activeUsers.length === 0 ? (
            <p className="text-sm text-stone-500">No users online</p>
          ) : (
            <ul className="space-y-2">
              {activeUsers.map((u) => {
                const name = u.profile?.name ?? u.email
                return (
                  <li key={u.id} className="flex items-center gap-2 text-sm text-stone-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 text-xs text-stone-600">
                      {u.isAdmin ? 'Admin' : ''}
                      {u.isBoard ? 'Board' : ''}
                      {u.isStudioMonitor ? 'Studio Monitor' : ''}
                      {!u.isAdmin && !u.isBoard && !u.isStudioMonitor && u.isProducer ? 'Producer' : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
