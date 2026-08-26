/** Role / profile fields mirrored onto the NextAuth JWT. */
export type JwtRoleFields = {
  id?: string
  isAdmin?: boolean
  isProducer?: boolean
  isBoardMember?: boolean
  isFieldProducer?: boolean
  isManagingArtists?: boolean
  producerProfile?: object
}

export type DbUserRoleRow = {
  isAdmin: boolean
  isProducer: boolean
  isBoardMember: boolean
  isFieldProducer: boolean
  isManagingArtists: boolean
  producerProfile: unknown
}

/**
 * Keep JWT role flags aligned with the DB. When the user row is missing
 * (e.g. admin deleted the account), strip identity and privileges so a
 * still-valid JWT cannot retain admin/producer access for the session maxAge.
 */
export function applyUserRowToJwtToken(
  token: JwtRoleFields,
  row: DbUserRoleRow | null
): void {
  if (row) {
    token.isAdmin = row.isAdmin
    token.isProducer = row.isProducer
    token.isBoardMember = row.isBoardMember
    token.isFieldProducer = row.isFieldProducer
    token.isManagingArtists = row.isManagingArtists
    token.producerProfile = (row.producerProfile as object) ?? undefined
    return
  }

  delete token.id
  token.isAdmin = false
  token.isProducer = false
  token.isBoardMember = false
  token.isFieldProducer = false
  token.isManagingArtists = false
  token.producerProfile = undefined
}
