'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Row = {
  id: string
  productionStatusName: string
  metaData: string | null
  isShowingMetaData: boolean | null
  additionalContent: string | null
  isShowingAdditionalContent: boolean | null
  isActive: boolean
  producersNote: string | null
}

export function AdminProductionStatusesClient() {
  const { data: rows, mutate } = useSWR<Row[]>('/api/admin/production-statuses', fetcher)
  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)

  async function save(row: Partial<Row> & { id?: string }) {
    const url = row.id
      ? `/api/admin/production-statuses/${row.id}`
      : '/api/admin/production-statuses'
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
      <p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          New production status
        </button>
      </p>
      {form}
      {rows?.map((r) => (
        <div key={r.id} className="media form-holder" style={{ marginBottom: 16 }}>
          <div className="media-body">
            <h4>
              {r.productionStatusName}{' '}
              <button type="button" className="btn btn-xs btn-primary" onClick={() => setEditing(r)}>
                Edit
              </button>{' '}
              <button type="button" className="btn btn-xs btn-danger" onClick={() => void remove(r.id)}>
                Delete
              </button>
            </h4>
            <div dangerouslySetInnerHTML={{ __html: r.additionalContent ?? '' }} />
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
    <div className="panel panel-default" style={{ marginBottom: 24 }}>
      <div className="panel-heading">{title}</div>
      <div className="panel-body" style={{ color: '#333' }}>
        <div className="form-group">
          <label>Name</label>
          <input
            className="form-control"
            value={v.productionStatusName ?? ''}
            onChange={(e) => setV({ ...v, productionStatusName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Meta data</label>
          <input
            className="form-control"
            value={v.metaData ?? ''}
            onChange={(e) => setV({ ...v, metaData: e.target.value })}
          />
        </div>
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              checked={!!v.isShowingMetaData}
              onChange={(e) => setV({ ...v, isShowingMetaData: e.target.checked })}
            />{' '}
            Show meta data
          </label>
        </div>
        <div className="form-group">
          <label>Additional content</label>
          <TipTapEditor
            value={v.additionalContent ?? ''}
            onChange={(html) => setV({ ...v, additionalContent: html })}
          />
        </div>
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              checked={!!v.isShowingAdditionalContent}
              onChange={(e) => setV({ ...v, isShowingAdditionalContent: e.target.checked })}
            />{' '}
            Show additional content
          </label>
        </div>
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              checked={!!v.isActive}
              onChange={(e) => setV({ ...v, isActive: e.target.checked })}
            />{' '}
            Active
          </label>
        </div>
        <div className="form-group">
          <label>Producers note</label>
          <TipTapEditor
            value={v.producersNote ?? ''}
            onChange={(html) => setV({ ...v, producersNote: html })}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onSave(v)}>
          Save
        </button>{' '}
        <button type="button" className="btn btn-default" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
