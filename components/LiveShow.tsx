'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useLayoutEffect } from 'react'
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
  modalBackdropClass,
  modalDialogClass,
  modalDialogLgClass,
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

const btnLg = (base: string) =>
  cn(base, 'px-3 py-2 text-sm sm:px-6 sm:py-3 sm:text-base')

function hasProducerMessageText(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.trim().length > 0
}

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

  const producerProfile = session?.user?.producerProfile as
    | {
        isAutomationUIEnabled?: boolean
        isMessagingUIEnabled?: boolean
      }
    | undefined
  const isAdmin = session?.user?.isAdmin
  const canEditProducerMessage = data?.canEditProducerMessage === true
  const producerMsgRef = useRef<HTMLTextAreaElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [footerPad, setFooterPad] = useState(160)
  const [producerMsgSaving, setProducerMsgSaving] = useState(false)
  const [producerMsgFeedback, setProducerMsgFeedback] = useState<string | null>(null)

  useLayoutEffect(() => {
    const el = footerRef.current
    if (!el) return
    const update = () => setFooterPad(el.offsetHeight + 16)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data?.show?.id, data?.show?.currentShowProducerMessage, data?.hasNextTrack])

  async function saveProducerMessage() {
    if (!show) return
    const raw = producerMsgRef.current?.value ?? ''
    const trimmed = raw.trim()
    setProducerMsgSaving(true)
    setProducerMsgFeedback(null)
    try {
      const res = await fetch(`/api/shows/${show.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentShowProducerMessage: trimmed.length > 0 ? trimmed : null,
        }),
      })
      if (!res.ok) {
        setProducerMsgFeedback('Could not save message. Try again.')
        return
      }
      if (trimmed.length > 0) {
        setProducerMsgFeedback(
          'Message saved. The show producer will see it as a banner at the bottom of Live Show.'
        )
      } else {
        setProducerMsgFeedback('Message cleared.')
      }
    } finally {
      setProducerMsgSaving(false)
      void mutate()
    }
  }

  async function clearProducerMessage() {
    if (!show) return
    await fetch(`/api/shows/${show.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentShowProducerMessage: null }),
    })
    void mutate()
  }

  if (error) {
    return <p className="text-red-400">Access denied or no active show.</p>
  }
  if (!data?.show) {
    return <p className="text-stone-400">No active show. Start a show from My Shows.</p>
  }

  const show = data.show
  const userId = session?.user?.id
  const isShowRunner =
    !!userId && (userId === show.userId || userId === show.helperUserId)
  const stationMessage = show.currentShowProducerMessage?.trim() ?? ''
  const showProducerBanner = isShowRunner && hasProducerMessageText(stationMessage)
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
    <div style={{ paddingBottom: footerPad }}>
      {show.hasRadioLogikTracking && (
        <div className="bg-[#c0a821] px-2 py-4 text-center text-stone-900">
          <h3 className="text-lg font-semibold">WARNING! Tracking is set to come from Radio Logik instead of the Kuzu App</h3>
        </div>
      )}
      {canEditProducerMessage && (
        <div className="mx-auto mt-4 max-w-4xl">
          <div className="rounded-lg border border-stone-700 bg-stone-900/40 p-4">
            <h3 className="mb-2 text-lg font-medium text-stone-100">Producer message</h3>
            <p className="mb-2 text-sm text-stone-400">
              Saved messages appear as a yellow banner for the show owner and helper on Live Show.
            </p>
            <textarea
              key={`producer-msg-${show.currentShowProducerMessage ?? ''}`}
              ref={producerMsgRef}
              defaultValue={show.currentShowProducerMessage ?? ''}
              rows={3}
              className="w-full rounded border border-stone-700 bg-stone-950 p-2 text-stone-100"
              placeholder="One message to show to the live show producer..."
              onChange={() => setProducerMsgFeedback(null)}
            />
            {producerMsgFeedback && (
              <p
                className={cn(
                  'mt-2 text-sm',
                  producerMsgFeedback.startsWith('Could not')
                    ? 'text-red-400'
                    : 'text-emerald-400'
                )}
              >
                {producerMsgFeedback}
              </p>
            )}
            <button
              type="button"
              className={cn(btnSmPrimary, 'mt-2')}
              disabled={producerMsgSaving}
              onClick={saveProducerMessage}
            >
              {producerMsgSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
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
                      <div className="clear-both mt-2 text-stone-300">
                        <span className="float-right text-sm">Album: {t.album}</span>
                        <div className="text-sm font-normal">Length: {t.trackLength}</div>
                        <div>Played at: {t.playDate ? prettifySimpleTime(t.playDate) : '-'}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-40 bg-stone-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]"
      >
        {showProducerBanner ? (
          <div className="border-t border-stone-900/20 bg-[#c0a821] px-3 py-2 text-center text-stone-900">
            <p className="m-0 text-sm font-semibold sm:text-base">Station message for you</p>
            <p className="mt-1 whitespace-pre-wrap text-sm sm:text-base">{stationMessage}</p>
            <button
              type="button"
              className={cn(btnSmDanger, 'mt-2')}
              onClick={clearProducerMessage}
            >
              Clear
            </button>
          </div>
        ) : null}
        <div className="show-control-panel p-2 sm:p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:gap-3">
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
            <div className="overflow-x-auto p-4">
              <table className={cn(tableClass, 'bg-white text-stone-900')}>
                <thead>
                  <tr className={tableHeadClass}>
                    <th className={tableCellClass}>Read</th>
                    <th className={tableCellClass}>Sent</th>
                    <th className={tableCellClass}>Content</th>
                    <th className={tableCellClass}>By</th>
                    <th className={tableCellClass} />
                  </tr>
                </thead>
                <tbody>
                  {showMessages?.map(
                    (m: {
                      id: string
                      isRead: boolean
                      sentAt: string
                      content: string
                      sentBy: string | null
                    }) => (
                      <tr key={m.id}>
                        <td className={tableCellClass}>{m.isRead ? 'Yes' : 'No'}</td>
                        <td className={tableCellClass}>{prettifySimpleTime(m.sentAt)}</td>
                        <td className={tableCellClass}>{m.content}</td>
                        <td className={tableCellClass}>{m.sentBy}</td>
                        <td className={tableCellClass}>
                          <button
                            type="button"
                            className={btnSmWarning}
                            onClick={async () => {
                              await fetch(`/api/messages/${m.id}`, { method: 'DELETE' })
                              void mutateMsg()
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
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
