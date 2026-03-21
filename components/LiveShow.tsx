'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { prettifySimpleTime } from '@/lib/utils-client'

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Failed')
  return r.json()
})

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

  const producerProfile = session?.user?.producerProfile as {
    isAutomationUIEnabled?: boolean
    isMessagingUIEnabled?: boolean
  } | undefined
  const isAdmin = session?.user?.isAdmin

  if (error) {
    return <p className="text-danger">Access denied or no active show.</p>
  }
  if (!data?.show) {
    return <p>No active show. Start a show from My Shows.</p>
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
        <div
          style={{
            backgroundColor: '#c0a821',
            padding: '15px 5px',
            textAlign: 'center',
          }}
        >
          <h3>WARNING! Tracking is set to come from Radio Logik instead of the Kuzu App</h3>
        </div>
      )}
      <h2>
        {show.showName} is live!{' '}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => router.push(`/edit-show/${show.id}`)}
        >
          Edit
        </button>
      </h2>
      <h3>
        {show.showStart ? prettifySimpleTime(show.showStart) : ''} -{' '}
        {show.showEnd ? prettifySimpleTime(show.showEnd) : ''}
      </h3>
      <h3>{show.defaultMeta}</h3>
      <hr />
      <div className="row">
        <section className="content">
          <div className="col-md-8 col-md-offset-2">
            <div className="panel panel-default">
              <div className="panel-body">
                <h3>Active show tracks</h3>
                <table className="table table-filter">
                  <tbody>
                    {tracks.map((t) => (
                      <tr
                        key={t.id}
                        className={`track ${t.trackType !== 'song' ? 'special-track' : ''}`}
                      >
                        <td style={{ width: 80 }}>
                          {(t.indexNumber ?? 0) > 0 && (
                            <button
                              type="button"
                              className="btn btn-link"
                              onClick={() =>
                                call(`/api/tracks/${t.id}/position`, {
                                  body: JSON.stringify({ direction: 'up' }),
                                })
                              }
                            >
                              <span className="glyphicon glyphicon-chevron-up" />
                            </button>
                          )}
                          <strong>{t.indexNumber}</strong>
                          {(t.indexNumber ?? 0) !== highest && highest >= 0 && (
                            <button
                              type="button"
                              className="btn btn-link"
                              onClick={() =>
                                call(`/api/tracks/${t.id}/position`, {
                                  body: JSON.stringify({ direction: 'down' }),
                                })
                              }
                            >
                              <span className="glyphicon glyphicon-chevron-down" />
                            </button>
                          )}
                        </td>
                        <td style={{ width: 40 }}>
                          {t.isHighlighted && (
                            <span className="glyphicon glyphicon-star" style={{ color: '#c0a821' }} />
                          )}
                        </td>
                        <td>
                          <h3 className="title">
                            {t.songTitle} - {t.artist}
                          </h3>
                          {t.playDate ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                onClick={() => call(`/api/tracks/${t.id}/start`)}
                              >
                                Restart Track
                              </button>
                              {(isAdmin || producerProfile?.isAutomationUIEnabled) && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    call(`/api/tracks/${t.id}/clear-playtime`)
                                  }
                                >
                                  Clear Playtime
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => call(`/api/tracks/${t.id}/start`)}
                            >
                              Start Track
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm pull-right"
                            onClick={() => router.push(`/edit-track/${t.id}`)}
                          >
                            Edit
                          </button>
                          <h4>
                            <span className="pull-right">Album: {t.album}</span>
                            <h5>Length: {t.trackLength}</h5>
                            Played at:{' '}
                            {t.playDate ? prettifySimpleTime(t.playDate) : '-'}
                          </h4>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="show-control-panel" style={{ background: '#222', padding: 16 }}>
        <div className="text-center">
          {data.hasNextTrack && (producerProfile?.isAutomationUIEnabled || isAdmin) && (
            <>
              {show.isAutoPlaying ? (
                <button
                  type="button"
                  className="btn btn-lg btn-info"
                  onClick={() => call('/api/live/autoplay', { body: JSON.stringify({ action: 'pause' }) })}
                >
                  Pause Autoplay
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-lg btn-success"
                  onClick={() => call('/api/live/autoplay', { body: JSON.stringify({}) })}
                >
                  Autoplay
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="btn btn-lg btn-danger"
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
              className="btn btn-lg btn-warning"
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
              className="btn btn-lg btn-primary"
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
              className="btn btn-lg btn-default"
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
            <button
              type="button"
              className="btn btn-lg btn-default"
              onClick={() => setRecentOpen(true)}
            >
              Recent Tracks
            </button>
          )}
          <button
            type="button"
            className="btn btn-lg btn-success"
            onClick={() => router.push(`/addTrackToShow/${show.id}`)}
          >
            Add a new track
          </button>
        </div>
      </div>

      {msgOpen && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" onClick={() => setMsgOpen(false)}>
                  &times;
                </button>
                <h4>Show Messages</h4>
              </div>
              <div className="modal-body">
                <table className="table" style={{ background: '#fff' }}>
                  <thead>
                    <tr>
                      <th>Read</th>
                      <th>Sent</th>
                      <th>Content</th>
                      <th>By</th>
                      <th />
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
                          <td>{m.isRead ? 'Yes' : 'No'}</td>
                          <td>{prettifySimpleTime(m.sentAt)}</td>
                          <td>{m.content}</td>
                          <td>{m.sentBy}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
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
        </div>
      )}

      {recentOpen && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" onClick={() => setRecentOpen(false)}>
                  &times;
                </button>
                <h4>Recently Played</h4>
              </div>
              <div className="modal-body">
                <table className="table" style={{ background: '#fff' }}>
                  <thead>
                    <tr>
                      <th>Artist</th>
                      <th>Title</th>
                      <th>Album</th>
                      <th>Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentlyPlayed?.map(
                      (t: { id: string; artist?: string; songTitle: string; album?: string; playDate?: string }) => (
                        <tr key={t.id}>
                          <td>{t.artist}</td>
                          <td>{t.songTitle}</td>
                          <td>{t.album}</td>
                          <td>{t.playDate ? prettifySimpleTime(t.playDate) : ''}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
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
        </div>
      )}
    </div>
  )
}
