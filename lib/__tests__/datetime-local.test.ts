import { describe, it, expect } from 'vitest'
import {
  parseLocalDateInputValue,
  parseLocalDateRangeEndExclusive,
  parseStationCalendarDayStart,
  parseStationExportDateRange,
} from '@/lib/datetime-local'

describe('parseLocalDateInputValue', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const d = parseLocalDateInputValue('2026-08-13')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(7)
    expect(d!.getDate()).toBe(13)
    expect(d!.getHours()).toBe(0)
  })
})

describe('parseLocalDateRangeEndExclusive', () => {
  it('returns start of next day so same-day ranges include polls', () => {
    const start = parseLocalDateInputValue('2026-08-13')
    const end = parseLocalDateRangeEndExclusive('2026-08-13')
    expect(start).not.toBeNull()
    expect(end).not.toBeNull()
    expect(start!.getTime()).toBeLessThan(end!.getTime())
    expect(end!.getDate()).toBe(14)
  })
})

describe('parseStationExportDateRange', () => {
  it('uses America/Chicago calendar days for licensing export', () => {
    const range = parseStationExportDateRange('2026-08-13', '2026-08-13')
    expect(range).not.toBeNull()
    expect(range!.from.toISOString()).toBe('2026-08-13T05:00:00.000Z')
    expect(range!.toExclusive.toISOString()).toBe('2026-08-14T05:00:00.000Z')
  })

  it('includes an evening Central play in a same-day export range', () => {
    const range = parseStationExportDateRange('2026-08-13', '2026-08-13')
    const playDate = new Date('2026-08-13T18:53:11.340Z')
    expect(playDate.getTime()).toBeGreaterThanOrEqual(range!.from.getTime())
    expect(playDate.getTime()).toBeLessThan(range!.toExclusive.getTime())
  })
})
