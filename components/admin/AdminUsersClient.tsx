'use client'

import useSWR from 'swr'
import { useState } from 'react'
import {
  btnPrimary,
  btnSecondary,
  btnXsDanger,
  btnXsPrimary,
  checkboxRowClass,
  formGroupClass,
  inputClassLight,
  labelClassLight,
  modalBackdropClass,
  modalDialogClass,
  tableClass,
  tableCellClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type UserRow = {
  id: string
  email: string
  profile: { name?: string } | null
  producerProfile: { isPioneer?: boolean } | null
  isProducer: boolean
  isAdmin: boolean
  isBoardMember: boolean
  isFieldProducer: boolean
}

export function AdminUsersClient() {
  const { data: users, mutate } = useSWR<UserRow[]>('/api/admin/users', fetcher)
  const [editing, setEditing] = useState<UserRow | null>(null)

  async function save() {
    if (!editing) return
    await fetch(`/api/admin/users/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isAdmin: editing.isAdmin,
        isProducer: editing.isProducer,
        isBoardMember: editing.isBoardMember,
        isFieldProducer: editing.isFieldProducer,
        profile: editing.profile,
        producerProfile: {
          ...editing.producerProfile,
          isPioneer: editing.producerProfile?.isPioneer ?? false,
        },
      }),
    })
    setEditing(null)
    void mutate()
  }

  async function remove(id: string) {
    if (!confirm('Delete user?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    void mutate()
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className={cn(tableClass, 'text-stone-300')}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Name</th>
              <th className={tableCellClass}>Email</th>
              <th className={tableCellClass}>Status</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id}>
                <td className={tableCellClass}>{u.profile?.name ?? '—'}</td>
                <td className={tableCellClass}>{u.email}</td>
                <td className={tableCellClass}>
                  {u.isAdmin && 'Admin '}
                  {u.isBoardMember && 'Board '}
                  {u.producerProfile?.isPioneer
                    ? 'Pioneer'
                    : u.isProducer
                      ? 'Evergreen'
                      : ''}
                  {u.isFieldProducer && 'Field Producer'}
                </td>
                <td className={tableCellClass}>
                  <button type="button" className={btnXsPrimary} onClick={() => setEditing({ ...u })}>
                    Edit
                  </button>{' '}
                  <button type="button" className={btnXsDanger} onClick={() => void remove(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className={modalBackdropClass} role="dialog" aria-modal="true">
          <div className={modalDialogClass}>
            <div className="border-b border-stone-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-lg font-semibold text-stone-900">Edit {editing.email}</h4>
                <button
                  type="button"
                  className="rounded p-1 text-2xl leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className={formGroupClass}>
                <label className={labelClassLight}>Display name</label>
                <input
                  className={inputClassLight}
                  value={editing.profile?.name ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      profile: { ...editing.profile, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className={checkboxRowClass}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={editing.isAdmin}
                    onChange={(e) => setEditing({ ...editing, isAdmin: e.target.checked })}
                  />
                  Admin
                </label>
              </div>
              <div className={checkboxRowClass}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={editing.isProducer}
                    onChange={(e) => setEditing({ ...editing, isProducer: e.target.checked })}
                  />
                  Producer
                </label>
              </div>
              <div className={checkboxRowClass}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={editing.isBoardMember}
                    onChange={(e) => setEditing({ ...editing, isBoardMember: e.target.checked })}
                  />
                  Board Member
                </label>
              </div>
              <div className={checkboxRowClass}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={editing.isFieldProducer}
                    onChange={(e) => setEditing({ ...editing, isFieldProducer: e.target.checked })}
                  />
                  Field Producer
                </label>
              </div>
              <div className={checkboxRowClass}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={!!editing.producerProfile?.isPioneer}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        producerProfile: {
                          ...editing.producerProfile,
                          isPioneer: e.target.checked,
                        },
                      })
                    }
                  />
                  Pioneer
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-200 p-4">
              <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={btnPrimary} onClick={() => void save()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
