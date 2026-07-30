import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'
import { prettifyTime, prettifyDate, prettifySimpleTime, getEmail } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })
})

describe('prettifyTime', () => {
  it('formats a date to hh:mm:ss', () => {
    const d = new Date('2024-01-15T14:30:00')
    expect(prettifyTime(d)).toBe('02:30:00')
  })

  it('returns empty string for null/undefined', () => {
    expect(prettifyTime(null)).toBe('')
    expect(prettifyTime(undefined)).toBe('')
  })
})

describe('prettifyDate', () => {
  it('formats a date to MMM DD', () => {
    // Use midday UTC to avoid timezone boundary issues
    const d = new Date('2024-01-15T12:00:00Z')
    expect(prettifyDate(d)).toBe('Jan 15')
  })

  it('returns empty string for null/undefined', () => {
    expect(prettifyDate(null)).toBe('')
    expect(prettifyDate(undefined)).toBe('')
  })
})

describe('prettifySimpleTime', () => {
  it('formats a date to h:mm a', () => {
    const d = new Date('2024-01-15T14:30:00')
    expect(prettifySimpleTime(d)).toBe('2:30 pm')
  })
})

describe('getEmail', () => {
  it('extracts first email address', () => {
    const emails = [{ address: 'test@example.com' }, { address: 'other@example.com' }]
    expect(getEmail(emails)).toBe('test@example.com')
  })

  it('returns empty string for empty array', () => {
    expect(getEmail([])).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(getEmail(undefined)).toBe('')
  })
})
