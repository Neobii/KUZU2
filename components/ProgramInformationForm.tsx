'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'

export function ProgramInformationForm() {
  const router = useRouter()
  const [showName, setShowName] = useState('')
  const [defaultMeta, setDefaultMeta] = useState('')
  const [description, setDescription] = useState('')
  const [isAutomationUIEnabled, setIsAutomationUIEnabled] = useState(false)
  const [isMessagingUIEnabled, setIsMessagingUIEnabled] = useState(false)
  const [messagingEnabledOnShows, setMessagingEnabledOnShows] = useState(false)

  useEffect(() => {
    void fetch('/api/users/me')
      .then((r) => r.json())
      .then((u) => {
        const pp = (u.producerProfile as {
          showName?: string
          defaultMeta?: string
          description?: string
          isAutomationUIEnabled?: boolean
          isMessagingUIEnabled?: boolean
          messagingEnabledOnShows?: boolean
        }) ?? {}
        setShowName(pp.showName ?? '')
        setDefaultMeta(pp.defaultMeta ?? '')
        setDescription(pp.description ?? '')
        setIsAutomationUIEnabled(!!pp.isAutomationUIEnabled)
        setIsMessagingUIEnabled(!!pp.isMessagingUIEnabled)
        setMessagingEnabledOnShows(!!pp.messagingEnabledOnShows)
      })
  }, [])

  async function save() {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producerProfile: {
          showName,
          defaultMeta,
          description,
          isAutomationUIEnabled,
          isMessagingUIEnabled,
          messagingEnabledOnShows,
        },
      }),
    })
    if (res.ok) {
      router.refresh()
      alert('Saved')
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="form-group">
        <label>Default show name</label>
        <input className="form-control" value={showName} onChange={(e) => setShowName(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Default meta (media player)</label>
        <textarea
          className="form-control"
          rows={2}
          value={defaultMeta}
          onChange={(e) => setDefaultMeta(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Default show description</label>
        <TipTapEditor value={description} onChange={setDescription} minHeight={180} />
      </div>
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            checked={isAutomationUIEnabled}
            onChange={(e) => setIsAutomationUIEnabled(e.target.checked)}
          />{' '}
          Enable automation tools
        </label>
      </div>
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            checked={isMessagingUIEnabled}
            onChange={(e) => setIsMessagingUIEnabled(e.target.checked)}
          />{' '}
          Enable messaging tools
        </label>
      </div>
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            checked={messagingEnabledOnShows}
            onChange={(e) => setMessagingEnabledOnShows(e.target.checked)}
          />{' '}
          Messaging enabled by default on new shows
        </label>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => void save()}>
        Save
      </button>
    </div>
  )
}
