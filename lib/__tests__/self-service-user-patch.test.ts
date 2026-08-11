import { describe, expect, it } from 'vitest'
import {
  sanitizeSelfServiceUserPatch,
  selfServicePatchHasUpdates,
} from '@/lib/self-service-user-patch'

describe('sanitizeSelfServiceUserPatch', () => {
  const base = {
    profile: { name: 'Old Name' },
    producerProfile: {
      bio: 'Old bio',
      isPioneer: false,
      showName: 'Night Shift',
    },
    isAdmin: false,
    isProducer: false,
  }

  it('merges allowed profile and producerProfile fields', () => {
    const result = sanitizeSelfServiceUserPatch(base, {
      profile: { name: 'New Name' },
      producerProfile: { bio: 'New bio', showName: 'Morning' },
    })
    expect(result.profile).toEqual({ name: 'New Name' })
    expect(result.producerProfile).toEqual({
      bio: 'New bio',
      isPioneer: false,
      showName: 'Morning',
    })
  })

  it('strips isPioneer for unprivileged users', () => {
    const result = sanitizeSelfServiceUserPatch(base, {
      producerProfile: { bio: 'x', isPioneer: true, isAdmin: true },
    })
    expect(result.producerProfile).toEqual({
      bio: 'x',
      isPioneer: false,
      showName: 'Night Shift',
    })
  })

  it('blocks role self-assignment for unprivileged users', () => {
    const result = sanitizeSelfServiceUserPatch(base, {
      isProducer: true,
      isAdmin: true,
      isBoardMember: true,
      profile: { name: 'Safe' },
    })
    expect(result.profile).toEqual({ name: 'Safe' })
    expect(result.isProducer).toBeUndefined()
    expect(result.isAdmin).toBeUndefined()
  })

  it('lets evergreen producers set isProducer but not isAdmin', () => {
    const evergreen = { ...base, isProducer: true }
    const result = sanitizeSelfServiceUserPatch(evergreen, {
      isProducer: false,
      isAdmin: true,
    })
    expect(result.isProducer).toBe(false)
    expect(result.isAdmin).toBeUndefined()
  })

  it('lets admins set isAdmin and isProducer (PoC)', () => {
    const admin = { ...base, isAdmin: true }
    const result = sanitizeSelfServiceUserPatch(admin, {
      isAdmin: true,
      isProducer: true,
      isBoardMember: true,
    })
    expect(result.isAdmin).toBe(true)
    expect(result.isProducer).toBe(true)
  })

  it('returns empty when body has no allowed fields', () => {
    expect(
      sanitizeSelfServiceUserPatch(base, {
        isProducer: true,
        producerProfile: { isPioneer: true },
      })
    ).toEqual({})
    expect(
      selfServicePatchHasUpdates(
        sanitizeSelfServiceUserPatch(base, { isProducer: true })
      )
    ).toBe(false)
  })

  it('preserves existing isPioneer when updating other producer fields', () => {
    const pioneer = {
      ...base,
      isProducer: true,
      producerProfile: { ...base.producerProfile, isPioneer: true },
    }
    const result = sanitizeSelfServiceUserPatch(pioneer, {
      producerProfile: { defaultMeta: 'meta' },
    })
    expect(result.producerProfile?.isPioneer).toBe(true)
    expect(result.producerProfile?.defaultMeta).toBe('meta')
  })
})
