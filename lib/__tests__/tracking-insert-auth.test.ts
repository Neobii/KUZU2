import { afterEach, describe, expect, it } from 'vitest'
import {
  canActivateArmedShowFromTrackingInsert,
  getTrackingInsertSecret,
} from '@/lib/tracking-insert-auth'

describe('tracking insert armed Go Live auth', () => {
  afterEach(() => {
    delete process.env.TRACKING_INSERT_SECRET
  })

  it('refuses activation when TRACKING_INSERT_SECRET is unset', () => {
    delete process.env.TRACKING_INSERT_SECRET
    expect(getTrackingInsertSecret()).toBeNull()
    expect(canActivateArmedShowFromTrackingInsert('Bearer anything')).toBe(false)
    expect(canActivateArmedShowFromTrackingInsert(null)).toBe(false)
  })

  it('refuses activation without a matching Bearer token', () => {
    process.env.TRACKING_INSERT_SECRET = 'station-secret'
    expect(canActivateArmedShowFromTrackingInsert(null)).toBe(false)
    expect(canActivateArmedShowFromTrackingInsert('Bearer wrong')).toBe(false)
    expect(canActivateArmedShowFromTrackingInsert('Basic station-secret')).toBe(false)
  })

  it('allows activation with the configured Bearer secret', () => {
    process.env.TRACKING_INSERT_SECRET = 'station-secret'
    expect(canActivateArmedShowFromTrackingInsert('Bearer station-secret')).toBe(true)
  })
})
