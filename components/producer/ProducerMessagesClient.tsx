'use client'

import useSWR from 'swr'
import { useEffect } from 'react'
import { prettifySimpleTime } from '@/lib/utils-client'
import {
  btnSmWarning,
  tableCellClass,
  tableClass,
  tableHeadClass,
} from '@/lib/ui'
import { cn } from '@/lib/cn'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type MessageRow = {
  id: string
  isRead: boolean
  sentAt: string
  content: string
  sentBy: string | null
}

export function ProducerMessagesClient() {
  const { data: messages, mutate } = useSWR<MessageRow[]>('/api/messages/mine', fetcher)

  useEffect(() => {
    return () => {
      void fetch('/api/messages/mark-user-read', { method: 'POST' })
    }
  }, [])

  async function removeMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) return
    const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
    if (res.ok) void mutate()
  }

  return (
    <div>
      <hr className="my-4 border-stone-700" />
      <div className="overflow-x-auto rounded-lg border border-stone-700">
        <table className={cn(tableClass, 'bg-white text-stone-900')}>
          <thead>
            <tr className={tableHeadClass}>
              <th className={tableCellClass}>Is Read</th>
              <th className={tableCellClass}>Sent At</th>
              <th className={tableCellClass}>Content</th>
              <th className={tableCellClass}>Sent By</th>
              <th className={tableCellClass} />
            </tr>
          </thead>
          <tbody>
            {messages?.length ? (
              messages.map((message) => (
                <tr key={message.id}>
                  <td className={tableCellClass}>{message.isRead ? 'true' : 'false'}</td>
                  <td className={tableCellClass}>{prettifySimpleTime(message.sentAt)}</td>
                  <td className={tableCellClass}>{message.content}</td>
                  <td className={tableCellClass}>{message.sentBy ?? '—'}</td>
                  <td className={tableCellClass}>
                    <button
                      type="button"
                      className={btnSmWarning}
                      onClick={() => void removeMessage(message.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={tableCellClass} colSpan={5}>
                  No messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
