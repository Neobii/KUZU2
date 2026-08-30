import { describe, expect, it } from 'vitest'
import { applyUserRowToJwtToken, type JwtRoleFields } from '@/lib/jwt-role-sync'

describe('applyUserRowToJwtToken', () => {
  it('copies role flags from the DB row onto the token', () => {
    const token: JwtRoleFields = {
      id: 'user-1',
      isAdmin: false,
      isProducer: false,
    }

    applyUserRowToJwtToken(token, {
      isAdmin: true,
      isProducer: true,
      isBoardMember: false,
      isFieldProducer: true,
      isManagingArtists: false,
      producerProfile: { showName: 'Night Shift' },
    })

    expect(token.id).toBe('user-1')
    expect(token.isAdmin).toBe(true)
    expect(token.isProducer).toBe(true)
    expect(token.isBoardMember).toBe(false)
    expect(token.isFieldProducer).toBe(true)
    expect(token.isManagingArtists).toBe(false)
    expect(token.producerProfile).toEqual({ showName: 'Night Shift' })
  })

  it('strips identity and privileges when the user row is missing', () => {
    const token: JwtRoleFields = {
      id: 'deleted-admin',
      isAdmin: true,
      isProducer: true,
      isBoardMember: true,
      isFieldProducer: true,
      isManagingArtists: true,
      producerProfile: { isPioneer: true },
    }

    applyUserRowToJwtToken(token, null)

    expect(token.id).toBeUndefined()
    expect(token.isAdmin).toBe(false)
    expect(token.isProducer).toBe(false)
    expect(token.isBoardMember).toBe(false)
    expect(token.isFieldProducer).toBe(false)
    expect(token.isManagingArtists).toBe(false)
    expect(token.producerProfile).toBeUndefined()
  })
})
