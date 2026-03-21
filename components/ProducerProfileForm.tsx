'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'
import { btnPrimary, checkboxRowClass, formGroupClass, inputClass, labelClass } from '@/lib/ui'

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
    <div className="max-w-3xl">
      <div className={formGroupClass}>
        <label className={labelClass}>Display name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={formGroupClass}>
        <label className={labelClass}>Bio</label>
        <TipTapEditor value={bio} onChange={setBio} minHeight={200} />
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
          <input
            type="checkbox"
            className="rounded border-stone-600"
            checked={isPioneer}
            onChange={(e) => setIsPioneer(e.target.checked)}
          />
          Pioneer producer
        </label>
      </div>
      <button type="button" className={btnPrimary} onClick={() => void save()}>
        Save
      </button>
    </div>
  )
}
