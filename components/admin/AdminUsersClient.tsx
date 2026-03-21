'use client'

import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type UserRow = {
  id: string
  email: string
  profile: { name?: string } | null
  producerProfile: { isPioneer?: boolean } | null
  isProducer: boolean
  isAdmin: boolean
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
      <table className="table" style={{ color: '#ddd' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id}>
              <td>{u.profile?.name ?? '—'}</td>
              <td>{u.email}</td>
              <td>
                {u.isAdmin && 'Admin '}
                {u.producerProfile?.isPioneer
                  ? 'Pioneer'
                  : u.isProducer
                    ? 'Evergreen'
                    : ''}
              </td>
              <td>
                <button type="button" className="btn btn-xs btn-primary" onClick={() => setEditing({ ...u })}>
                  Edit
                </button>{' '}
                <button type="button" className="btn btn-xs btn-danger" onClick={() => void remove(u.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div
          className="modal show"
          style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0, zIndex: 1050 }}
        >
          <div className="modal-dialog">
            <div className="modal-content" style={{ color: '#333' }}>
              <div className="modal-header">
                <button type="button" className="close" onClick={() => setEditing(null)}>
                  &times;
                </button>
                <h4>Edit {editing.email}</h4>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Display name</label>
                  <input
                    className="form-control"
                    value={editing.profile?.name ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        profile: { ...editing.profile, name: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={editing.isAdmin}
                      onChange={(e) => setEditing({ ...editing, isAdmin: e.target.checked })}
                    />{' '}
                    Admin
                  </label>
                </div>
                <div className="checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={editing.isProducer}
                      onChange={(e) => setEditing({ ...editing, isProducer: e.target.checked })}
                    />{' '}
                    Producer
                  </label>
                </div>
                <div className="checkbox">
                  <label>
                    <input
                      type="checkbox"
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
                    />{' '}
                    Pioneer
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void save()}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
