'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'

export function ProducerProfileForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [isPioneer, setIsPioneer] = useState(false)

  useEffect(() => {
    void fetch('/api/users/me')
      .then((r) => r.json())
      .then((u) => {
        const prof = (u.profile as { name?: string }) ?? {}
        const pp = (u.producerProfile as { bio?: string; isPioneer?: boolean }) ?? {}
        setName(prof.name ?? '')
        setBio(pp.bio ?? '')
        setIsPioneer(!!pp.isPioneer)
      })
  }, [])

  async function save() {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: { name },
        producerProfile: { bio, isPioneer },
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
        <label>Display name</label>
        <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Bio</label>
        <TipTapEditor value={bio} onChange={setBio} minHeight={200} />
      </div>
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={isPioneer} onChange={(e) => setIsPioneer(e.target.checked)} />{' '}
          Pioneer producer
        </label>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => void save()}>
        Save
      </button>
    </div>
  )
}
