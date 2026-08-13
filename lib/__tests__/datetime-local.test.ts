import { describe, it, expect } from 'vitest'
import { inclusiveLocalDateRangeToExclusiveBounds } from '@/lib/datetime-local'

describe('inclusiveLocalDateRangeToExclusiveBounds', () => {
  it('includes the selected end date via an exclusive next-day bound', () => {
    const bounds = inclusiveLocalDateRangeToExclusiveBounds('2026-08-01', '2026-08-07')
    expect(bounds).not.toBeNull()
    expect(bounds!.from).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0))
    expect(bounds!.toExclusive).toEqual(new Date(2026, 7, 8, 0, 0, 0, 0))
  })

  it('allows a single inclusive calendar day', () => {
    const bounds = inclusiveLocalDateRangeToExclusiveBounds('2026-08-01', '2026-08-01')
    expect(bounds).not.toBeNull()
    expect(bounds!.from).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0))
    expect(bounds!.toExclusive).toEqual(new Date(2026, 7, 2, 0, 0, 0, 0))
  })

  it('rejects inverted ranges and invalid dates', () => {
    expect(inclusiveLocalDateRangeToExclusiveBounds('2026-08-07', '2026-08-01')).toBeNull()
    expect(inclusiveLocalDateRangeToExclusiveBounds('', '2026-08-01')).toBeNull()
    expect(inclusiveLocalDateRangeToExclusiveBounds('2026-08-01', 'not-a-date')).toBeNull()
  })
})
