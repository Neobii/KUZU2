'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import moment from 'moment'
import { btnPrimary, btnSecondary, inputClass } from '@/lib/ui'
import { cn } from '@/lib/cn'

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false })

export function KuzuStatsClient() {
  const [from, setFrom] = useState(() => moment().subtract(2, 'hours').format('YYYY-MM-DDTHH:mm'))
  const [to, setTo] = useState(() => moment().format('YYYY-MM-DDTHH:mm'))
  const [hoursFrom, setHoursFrom] = useState('')
  const [hoursTo, setHoursTo] = useState('')
  const [hoursResult, setHoursResult] = useState<number | null>(null)
  const [hoursError, setHoursError] = useState('')
  const [chartError, setChartError] = useState('')
  const [loadingChart, setLoadingChart] = useState(false)
  const [loadingHours, setLoadingHours] = useState(false)
  const [hc, setHc] = useState<typeof import('highcharts') | null>(null)
  const [opts, setOpts] = useState<import('highcharts').Options | null>(null)

  useEffect(() => {
    void import('highcharts').then((m) => setHc(m.default))
  }, [])

  async function refreshChart() {
    setChartError('')
    setLoadingChart(true)
    try {
      const qs = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      })
      const res = await fetch(`/api/listeners/stats?${qs}`)
      if (!res.ok) {
        setChartError(res.status === 403 ? 'You do not have access to listener stats.' : 'Could not load stats.')
        setOpts(null)
        return
      }
      const rows = await res.json()
      const data: [number, number][] = rows.map(
        (r: { fetchDate: string; numListeners: number }) => [
          new Date(r.fetchDate).getTime(),
          r.numListeners || 0,
        ]
      )
      if (!hc) return
      if (data.length === 0) {
        setChartError('No listener data in this time range.')
        setOpts(null)
        return
      }
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
            name: 'Kuzu Online Streaming Listeners',
            data,
          },
        ],
      })
    } finally {
      setLoadingChart(false)
    }
  }

  useEffect(() => {
    if (hc) void refreshChart()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manual "View range" also refreshes
  }, [hc])

  async function computeHours() {
    setHoursError('')
    setHoursResult(null)
    if (!hoursFrom || !hoursTo) {
      setHoursError('You need a start date and end date.')
      return
    }
    setLoadingHours(true)
    try {
      const res = await fetch('/api/listeners/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: hoursFrom,
          endDate: hoursTo,
        }),
      })
      if (!res.ok) {
        setHoursError('Could not calculate listening hours.')
        return
      }
      const j = await res.json()
      setHoursResult(j.hours)
    } finally {
      setLoadingHours(false)
    }
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
        <button
          type="button"
          className={btnPrimary}
          disabled={loadingChart}
          onClick={() => void refreshChart()}
        >
          {loadingChart ? 'Loading…' : 'View range'}
        </button>
      </div>
      {chartError && <p className="mb-3 text-sm text-amber-300">{chartError}</p>}
      {opts && hc && <HighchartsReact highcharts={hc} options={opts} />}
      <hr className="my-6 border-stone-700" />
      <h3 className="mb-3 text-lg font-medium text-stone-200">Listening hours (range)</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          className={cn(inputClass, 'max-w-[12rem]')}
          value={hoursFrom}
          onChange={(e) => setHoursFrom(e.target.value)}
        />
        <input
          type="date"
          className={cn(inputClass, 'max-w-[12rem]')}
          value={hoursTo}
          onChange={(e) => setHoursTo(e.target.value)}
        />
        <button
          type="button"
          className={btnSecondary}
          disabled={loadingHours}
          onClick={() => void computeHours()}
        >
          {loadingHours ? 'Calculating…' : 'Get listening hours'}
        </button>
      </div>
      {hoursError && <p className="mb-2 text-sm text-red-400">{hoursError}</p>}
      {hoursResult != null && (
        <p className="text-stone-300">Approximate hours: {hoursResult.toFixed(2)}</p>
      )}
    </div>
  )
}
