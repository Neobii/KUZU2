'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'
import {
  btnPrimary,
  btnSecondary,
  btnXsDanger,
  btnXsPrimary,
  checkboxRowClass,
  formGroupClass,
  inputClassLight,
  labelClassLight,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Row = {
  id: string
  productionStatusName: string
  metaData: string | null
  isShowingMetaData: boolean | null
  additionalContent: string | null
  isShowingAdditionalContent: boolean | null
  isDisplayingLocalArtistShows: boolean
  isActive: boolean
  producersNote: string | null
}

export function AdminProductionStatusesClient() {
  const { data: rows, mutate } = useSWR<Row[]>('/api/admin/production-statuses', fetcher)
  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)

  async function save(row: Partial<Row> & { id?: string }) {
    const url = row.id ? `/api/admin/production-statuses/${row.id}` : '/api/admin/production-statuses'
    const method = row.id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })
    if (res.ok) {
      setEditing(null)
      setCreating(false)
      void mutate()
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete?')) return
    await fetch(`/api/admin/production-statuses/${id}`, { method: 'DELETE' })
    void mutate()
  }

  const form = creating ? (
    <StatusForm
      title="New production status"
      initial={{
        productionStatusName: '',
        metaData: '',
        isShowingMetaData: false,
        additionalContent: '',
        isShowingAdditionalContent: false,
        isDisplayingLocalArtistShows: false,
        isActive: false,
        producersNote: '',
      }}
      onSave={(r) => void save(r)}
      onCancel={() => setCreating(false)}
    />
  ) : editing ? (
    <StatusForm
      title="Edit"
      initial={editing}
      onSave={(r) => void save({ ...r, id: editing.id })}
      onCancel={() => setEditing(null)}
    />
  ) : null

  return (
    <div>
      <p className="mb-4">
        <button type="button" className={btnPrimary} onClick={() => setCreating(true)}>
          New production status
        </button>
      </p>
      {form}
      {rows?.map((r) => (
        <div key={r.id} className="form-holder mb-4">
          <div>
            <h4 className="text-lg font-medium text-stone-100">
              {r.productionStatusName}{' '}
              <button type="button" className={btnXsPrimary} onClick={() => setEditing(r)}>
                Edit
              </button>{' '}
              <button type="button" className={btnXsDanger} onClick={() => void remove(r.id)}>
                Delete
              </button>
            </h4>
            <div className="max-w-none text-sm text-stone-300" dangerouslySetInnerHTML={{ __html: r.additionalContent ?? '' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusForm({
  title,
  initial,
  onSave,
  onCancel,
}: {
  title: string
  initial: Partial<Row>
  onSave: (r: Partial<Row>) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)

  return (
    <div className="mb-6 rounded-lg border border-stone-600 bg-white p-4 text-stone-900 shadow-lg">
      <div className={cn('mb-4 border-b border-stone-200 pb-2', 'text-lg font-semibold')}>{title}</div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Name</label>
        <input
          className={inputClassLight}
          value={v.productionStatusName ?? ''}
          onChange={(e) => setV({ ...v, productionStatusName: e.target.value })}
        />
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Meta data</label>
        <input
          className={inputClassLight}
          value={v.metaData ?? ''}
          onChange={(e) => setV({ ...v, metaData: e.target.value })}
        />
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={!!v.isShowingMetaData}
            onChange={(e) => setV({ ...v, isShowingMetaData: e.target.checked })}
          />
          Show meta data
        </label>
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Additional content</label>
        <TipTapEditor
          value={v.additionalContent ?? ''}
          onChange={(html) => setV({ ...v, additionalContent: html })}
        />
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={!!v.isShowingAdditionalContent}
            onChange={(e) => setV({ ...v, isShowingAdditionalContent: e.target.checked })}
          />
          Show additional content
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={!!v.isDisplayingLocalArtistShows}
            onChange={(e) => setV({ ...v, isDisplayingLocalArtistShows: e.target.checked })}
          />
          Display local artist shows
        </label>
      </div>
      <div className={checkboxRowClass}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="rounded border-stone-400"
            checked={!!v.isActive}
            onChange={(e) => setV({ ...v, isActive: e.target.checked })}
          />
          Active
        </label>
      </div>
      <div className={formGroupClass}>
        <label className={labelClassLight}>Producers note</label>
        <TipTapEditor
          value={v.producersNote ?? ''}
          onChange={(html) => setV({ ...v, producersNote: html })}
        />
      </div>
      <button type="button" className={btnPrimary} onClick={() => onSave(v)}>
        Save
      </button>{' '}
      <button type="button" className={cn(btnSecondary, 'ml-2')} onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
