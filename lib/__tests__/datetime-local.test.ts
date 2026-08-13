import { describe, it, expect } from 'vitest'
import {
  parseLocalDateInputValue,
  parseLocalDateRangeEndExclusive,
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
