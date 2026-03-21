'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import moment from 'moment'
import { btnPrimary, btnSecondary, inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false })

export function KuzuStatsClient() {
  const [from, setFrom] = useState(() => moment().subtract(2, 'hours').toISOString().slice(0, 16))
  const [to, setTo] = useState(() => moment().toISOString().slice(0, 16))
  const [hoursResult, setHoursResult] = useState<number | null>(null)
  const [hc, setHc] = useState<typeof import('highcharts') | null>(null)
  const [opts, setOpts] = useState<import('highcharts').Options | null>(null)

  useEffect(() => {
    void import('highcharts').then((m) => setHc(m.default))
  }, [])

  async function refreshChart() {
    const qs = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    })
    const res = await fetch(`/api/listeners/stats?${qs}`)
    if (!res.ok) return
    const rows = await res.json()
    const data: [number, number][] = rows.map(
      (r: { fetchDate: string; numListeners: number }) => [
        new Date(r.fetchDate).getTime(),
        r.numListeners || 0,
      ]
    )
    if (!hc) return
    setOpts({
      chart: {
        type: 'line',
        backgroundColor: 'rgba(255,255,255,0.7)',
      },
      colors: ['#F15822'],
      title: { text: '' },
      xAxis: {
        type: 'datetime',
        title: { text: 'Time' },
        labels: {
          formatter: function () {
            return moment(this.value as number).format('hh:mm a')
          },
        },
      },
      yAxis: { title: { text: 'Kuzu Online Streaming Listeners' } },
      series: [
        {
          type: 'line',
          name: 'Listeners',
          data,
        },
      ],
    })
  }

  useEffect(() => {
    if (hc) void refreshChart()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manual "View range" also refreshes
  }, [hc])

  async function computeHours() {
    const df = (document.getElementById('dateFrom') as HTMLInputElement)?.value
    const dt = (document.getElementById('dateTo') as HTMLInputElement)?.value
    if (!df || !dt) return
    const res = await fetch('/api/listeners/hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: df,
        endDate: dt,
      }),
    })
    if (!res.ok) return
    const j = await res.json()
    setHoursResult(j.hours)
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-stone-100">Listener Stats</h2>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-stone-300">
          From{' '}
          <input
            type="datetime-local"
            className={cn(inputClass, 'ml-1 max-w-[14rem]')}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm text-stone-300">
          To{' '}
          <input
            type="datetime-local"
            className={cn(inputClass, 'ml-1 max-w-[14rem]')}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="button" className={btnPrimary} onClick={() => void refreshChart()}>
          View range
        </button>
      </div>
      {opts && hc && <HighchartsReact highcharts={hc} options={opts} />}
      <hr className="my-6 border-stone-700" />
      <h3 className="mb-3 text-lg font-medium text-stone-200">Listening hours (range)</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input id="dateFrom" type="date" className={cn(inputClass, 'max-w-[12rem]')} />
        <input id="dateTo" type="date" className={cn(inputClass, 'max-w-[12rem]')} />
        <button type="button" className={btnSecondary} onClick={() => void computeHours()}>
          Get listening hours
        </button>
      </div>
      {hoursResult != null && <p className="text-stone-300">Approximate hours: {hoursResult.toFixed(2)}</p>}
    </div>
  )
}
