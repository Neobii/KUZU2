'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { prettifySimpleTime } from '@/lib/utils-client'
import {
  btnPrimary,
  btnSecondary,
  btnSmDanger,
  btnSmPrimary,
  btnSmSuccess,
  btnSmWarning,
  btnSuccess,
  btnWarning,
  btnInfo,
  btnDanger,
  btnLink,
  btnXsDanger,
  modalBackdropClass,
  modalDialogClass,
  modalDialogLgClass,
  inputClassLight,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed')
    return r.json()
  })

function ChevronUp() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M14.707 12.293a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
    </svg>
  )
}
function ChevronDown() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden style={{ color: '#c0a821' }}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

const btnLg = (base: string) => cn(base, 'px-6 py-3 text-base')

export function LiveShow() {
  const router = useRouter()
  const { data: session } = useSession()
  const [recentOpen, setRecentOpen] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)
  const { data, mutate, error } = useSWR('/api/live/session', fetcher, {
    refreshInterval: 3000,
  })
  const { data: showMessages, mutate: mutateMsg } = useSWR(
    msgOpen ? '/api/messages/active-show' : null,
    fetcher,
    { refreshInterval: msgOpen ? 5000 : 0 }
  )

  const [msgText, setMsgText] = useState('')
  const [msgTargetRole, setMsgTargetRole] = useState('admin')
  const [sendingMsg, setSendingMsg] = useState(false)
  const msgInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!msgOpen) return
    const hb = setInterval(() => {
      fetch('/api/live/heartbeat', { method: 'POST' }).catch(() => {})
    }, 10_000)
    fetch('/api/live/heartbeat', { method: 'POST' }).catch(() => {})
    return () => clearInterval(hb)
  }, [msgOpen])

  const producerProfile = session?.user?.producerProfile as
    | {
        isAutomationUIEnabled?: boolean
        isMessagingUIEnabled?: boolean
      }
    | undefined
  const isAdmin = session?.user?.isAdmin

  if (error) {
    return <p className="text-red-400">Access denied or no active show.</p>
  }
  if (!data?.show) {
    return <p className="text-stone-400">No active show. Start a show from My Shows.</p>
  }

  const show = data.show
  const tracks = data.tracks as Array<{
    id: string
    indexNumber: number | null
    songTitle: string
    artist: string | null
    album: string | null
    playDate: string | null
    trackLength: string | null
    trackType: string
    isHighlighted: boolean
  }>

  async function call(url: string, options?: RequestInit) {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    void mutate()
  }

  const highest = data.highestIndex as number

  return (
    <div>
      {show.hasRadioLogikTracking && (
        <div className="bg-[#c0a821] px-2 py-4 text-center text-stone-900">
          <h3 className="text-lg font-semibold">WARNING! Tracking is set to come from Radio Logik instead of the Kuzu App</h3>
        </div>
      )}
      <h2 className="mt-4 text-xl font-semibold text-stone-100">
        {show.showName} is live!{' '}
        <button
          type="button"
          className={cn(btnSmPrimary, 'ml-2')}
          onClick={() => router.push(`/edit-show/${show.id}`)}
        >
          Edit
        </button>
      </h2>
      <h3 className="text-stone-300">
        {show.showStart ? prettifySimpleTime(show.showStart) : ''} -{' '}
        {show.showEnd ? prettifySimpleTime(show.showEnd) : ''}
      </h3>
      <h3 className="text-stone-400">{show.defaultMeta}</h3>
      <hr className="my-4 border-stone-700" />

      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-4">
          <h3 className="mb-3 text-lg font-medium text-stone-100">Active show tracks</h3>
          <div className="overflow-x-auto">
            <table className={cn(tableClass, 'table-filter')}>
              <tbody>
                {tracks.map((t) => (
                  <tr
                    key={t.id}
                    className={cn('track border-b border-stone-800', t.trackType !== 'song' && 'special-track')}
                  >
                    <td className={cn(tableCellClass, 'w-20 align-top')}>
                      {(t.indexNumber ?? 0) > 0 && (
                        <button
                          type="button"
                          className={cn(btnLink, 'p-0')}
                          onClick={() =>
                            call(`/api/tracks/${t.id}/position`, {
                              body: JSON.stringify({ direction: 'up' }),
                            })
                          }
                        >
                          <ChevronUp />
                        </button>
                      )}
                      <strong className="text-stone-100">{t.indexNumber}</strong>
                      {(t.indexNumber ?? 0) !== highest && highest >= 0 && (
                        <button
                          type="button"
                          className={cn(btnLink, 'p-0')}
                          onClick={() =>
                            call(`/api/tracks/${t.id}/position`, {
                              body: JSON.stringify({ direction: 'down' }),
                            })
                          }
                        >
                          <ChevronDown />
                        </button>
                      )}
                    </td>
                    <td className={cn(tableCellClass, 'w-10 align-top')}>
                      {t.isHighlighted && <StarIcon />}
                    </td>
                    <td className={tableCellClass}>
                      <h3 className="title text-lg font-medium text-stone-100">
                        {t.songTitle} - {t.artist}
                      </h3>
                      {t.playDate ? (
                        <>
                          <button
                            type="button"
                            className={cn(btnSmWarning, 'mr-2 mt-2')}
                            onClick={() => call(`/api/tracks/${t.id}/start`)}
                          >
                            Restart Track
                          </button>
                          {(isAdmin || producerProfile?.isAutomationUIEnabled) && (
                            <button
                              type="button"
                              className={cn(btnSmDanger, 'mt-2')}
                              onClick={() => call(`/api/tracks/${t.id}/clear-playtime`)}
                            >
                              Clear Playtime
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          className={cn(btnSmSuccess, 'mt-2')}
                          onClick={() => call(`/api/tracks/${t.id}/start`)}
                        >
                          Start Track
                        </button>
                      )}
                      <button
                        type="button"
                        className={cn(btnSmPrimary, 'float-right mt-2')}
                        onClick={() => router.push(`/edit-track/${t.id}`)}
                      >
                        Edit
                      </button>
                      <h4 className="clear-both mt-2 text-stone-300">
                        <span className="float-right text-sm">Album: {t.album}</span>
                        <h5 className="text-sm font-normal">Length: {t.trackLength}</h5>
                        Played at: {t.playDate ? prettifySimpleTime(t.playDate) : '-'}
                      </h4>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="show-control-panel bg-stone-900 p-4">
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          {data.hasNextTrack && (producerProfile?.isAutomationUIEnabled || isAdmin) && (
            <>
              {show.isAutoPlaying ? (
                <button
                  type="button"
                  className={btnLg(btnInfo)}
                  onClick={() => call('/api/live/autoplay', { body: JSON.stringify({ action: 'pause' }) })}
                >
                  Pause Autoplay
                </button>
              ) : (
                <button
                  type="button"
                  className={btnLg(btnSuccess)}
                  onClick={() => call('/api/live/autoplay', { body: JSON.stringify({}) })}
                >
                  Autoplay
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className={btnLg(btnDanger)}
            onClick={async () => {
              if (!confirm('Stop this show?')) return
              await call(`/api/shows/${show.id}/deactivate`)
              router.push('/producer/shows')
            }}
          >
            Stop Show
          </button>
          {show.isShowingDefaultMeta ? (
            <button
              type="button"
              className={btnLg(btnWarning)}
              onClick={() =>
                call('/api/live/show-meta', {
                  body: JSON.stringify({ showId: show.id, useDefaultMeta: false }),
                })
              }
            >
              Display song title
            </button>
          ) : (
            <button
              type="button"
              className={btnLg(btnPrimary)}
              onClick={() =>
                call('/api/live/show-meta', {
                  body: JSON.stringify({ showId: show.id, useDefaultMeta: true }),
                })
              }
            >
              Display show title
            </button>
          )}
          {producerProfile?.isMessagingUIEnabled && (
            <button
              type="button"
              className={btnLg(btnSecondary)}
              onClick={() => {
                setMsgOpen(true)
                void fetch('/api/messages/mark-show-read', { method: 'POST' })
                void mutate()
              }}
            >
              Messages ({data.messageCount ?? 0})
            </button>
          )}
          {data.recentlyPlayed?.length > 0 && (
            <button type="button" className={btnLg(btnSecondary)} onClick={() => setRecentOpen(true)}>
              Recent Tracks
            </button>
          )}
          <button
            type="button"
            className={btnLg(btnSuccess)}
            onClick={() => router.push(`/addTrackToShow/${show.id}`)}
          >
            Add a new track
          </button>
        </div>
      </div>

      {msgOpen && (
        <div className={modalBackdropClass} role="dialog" aria-modal="true">
          <div className={modalDialogLgClass}>
            <div className="border-b border-stone-200 p-4">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-semibold text-stone-900">Show Messages</h4>
                <button
                  type="button"
                  className="rounded p-1 text-2xl text-stone-500 hover:bg-stone-100"
                  onClick={() => setMsgOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3 max-h-[40vh] min-h-[200px] overflow-y-auto rounded border border-stone-200 bg-stone-50 p-3">
                {showMessages?.length === 0 ? (
                  <p className="text-center text-sm text-stone-400">No messages</p>
                ) : (
                  [...(showMessages ?? [])].reverse().map((m: {
                    id: string
                    isRead: boolean
                    sentAt: string
                    content: string
                    sentBy: string | null
                  }) => (
                    <div
                      key={m.id}
                      className={cn(
                        'mb-2 rounded p-2 text-sm',
                        m.sentBy?.toLowerCase().includes('producer')
                          ? 'ml-8 border-l-4 border-emerald-500 bg-stone-100'
                          : 'mr-8 border-l-4 border-amber-500 bg-white',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-stone-900">{m.content}</p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {m.sentBy ?? 'Unknown'} · {prettifySimpleTime(m.sentAt)}
                          </p>
                          {(m as { targetRole?: string }).targetRole && (
                            <span className="mt-1 inline-block rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-stone-600">
                              To: {(m as { targetRole?: string }).targetRole === 'admin' ? 'Admin' : (m as { targetRole?: string }).targetRole === 'producer' ? 'Producer' : (m as { targetRole?: string }).targetRole === 'board' ? 'Board' : (m as { targetRole?: string }).targetRole === 'studio_monitor' ? 'Studio Monitor' : 'Everyone'}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={btnXsDanger}
                          onClick={async () => {
                            await fetch(`/api/messages/${m.id}`, { method: 'DELETE' })
                            void mutateMsg()
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!msgText.trim() || sendingMsg) return
                  setSendingMsg(true)
                  fetch('/api/messages/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: msgText, targetRole: msgTargetRole }),
                  })
                    .then(() => {
                      setMsgText('')
                      void mutateMsg()
                    })
                    .finally(() => setSendingMsg(false))
                }}
                className="flex flex-wrap gap-2"
              >
                <select
                  value={msgTargetRole}
                  onChange={(e) => setMsgTargetRole(e.target.value)}
                  className="rounded border border-stone-300 bg-white px-2 py-2 text-sm text-stone-800"
                >
                  <option value="admin">To Admin</option>
                  <option value="board">To Board</option>
                  <option value="studio_monitor">To Studio Monitor</option>
                  <option value="all">To Everyone</option>
                </select>
                <input
                  ref={msgInputRef}
                  type="text"
                  className={cn(inputClassLight, 'min-w-[150px] flex-1')}
                  placeholder="Reply…"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
                <button type="submit" className={btnPrimary} disabled={sendingMsg || !msgText.trim()}>
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {recentOpen && (
        <div className={modalBackdropClass} role="dialog" aria-modal="true">
          <div className={modalDialogClass}>
            <div className="border-b border-stone-200 p-4">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-semibold text-stone-900">Recently Played</h4>
                <button
                  type="button"
                  className="rounded p-1 text-2xl text-stone-500 hover:bg-stone-100"
                  onClick={() => setRecentOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-x-auto p-4">
              <table className={cn(tableClass, 'bg-white text-stone-900')}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className={tableCellClass}>Artist</th>
                    <th className={tableCellClass}>Title</th>
                    <th className={tableCellClass}>Album</th>
                    <th className={tableCellClass}>Played</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentlyPlayed?.map(
                    (t: {
                      id: string
                      artist?: string
                      songTitle: string
                      album?: string
                      playDate?: string
                    }) => (
                      <tr key={t.id}>
                        <td className={tableCellClass}>{t.artist}</td>
                        <td className={tableCellClass}>{t.songTitle}</td>
                        <td className={tableCellClass}>{t.album}</td>
                        <td className={tableCellClass}>{t.playDate ? prettifySimpleTime(t.playDate) : ''}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-stone-200 p-4">
              <button
                type="button"
                className={btnSecondary}
                onClick={async () => {
                  await call('/api/live/clear-highlighted')
                  setRecentOpen(false)
                  void mutate()
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
