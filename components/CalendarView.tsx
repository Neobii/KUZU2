'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import moment from 'moment'

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput } from '@fullcalendar/core'

export function CalendarView() {
  const [events, setEvents] = useState<EventInput[]>([])

  async function loadRange(start: Date, end: Date) {
    const qs = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    })
    const res = await fetch(`/api/calendar/shows?${qs}`)
    if (!res.ok) return
    const shows = await res.json()
    setEvents(
      shows.map(
        (s: {
          id: string
          showName: string
          showStart: string
          showEnd: string
        }) => ({
          id: s.id,
          title: s.showName,
          start: s.showStart,
          end: s.showEnd,
        })
      )
    )
  }

  return (
    <div className="calendar-container" style={{ background: '#fff', padding: 16 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'today prev,next',
        }}
        events={events}
        datesSet={(arg) => {
          void loadRange(arg.start, arg.end)
        }}
        eventContent={(arg) => {
          const start = moment(arg.event.start).format('h:mm a')
          const end = moment(arg.event.end).format('h:mm a')
          return (
            <div>
              <p>
                {start} - {end}
              </p>
              <p className="title">{arg.event.title}</p>
            </div>
          )
        }}
        height="auto"
      />
    </div>
  )
}
