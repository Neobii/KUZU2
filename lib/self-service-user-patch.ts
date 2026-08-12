/** Fields anyone may edit on their own account via PATCH /api/users/me. */
export const SELF_SERVICE_PROFILE_KEYS = ['name'] as const

export const SELF_SERVICE_PRODUCER_PROFILE_KEYS = [
  'bio',
  'showName',
  'defaultMeta',
  'description',
  'isAutomationUIEnabled',
  'isMessagingUIEnabled',
  'messagingEnabledOnShows',
] as const

type JsonObject = Record<string, unknown>

export type SelfServiceUserCurrent = {
  profile: unknown
  producerProfile: unknown
  isAdmin: boolean
  isProducer: boolean
}

export type SelfServiceUserPatch = {
  profile?: JsonObject
  producerProfile?: JsonObject
  /** Temporary PoC: only if caller is already admin or evergreen (isProducer). */
  isProducer?: boolean
  /** Temporary PoC: only if caller is already admin (no escalation to admin). */
  isAdmin?: boolean
}

function pickAllowed(source: unknown, allowed: readonly string[]): JsonObject {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {}
  const out: JsonObject = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = (source as JsonObject)[key]
    }
  }
  return out
}

/**
 * Build safe profile / producerProfile merges for self-service updates.
 *
 * Role policy (temporary PoC — tighten later):
 * - Unprivileged users: no role flags.
 * - Existing evergreen (`isProducer`) or admin: may set `isProducer`.
 * - Existing admin only: may set `isAdmin` (cannot gain admin if not already admin).
 * - Other roles (board, field producer, artist manager, pioneer) stay admin-API only.
 */
export function sanitizeSelfServiceUserPatch(
  current: SelfServiceUserCurrent,
  body: unknown
): SelfServiceUserPatch {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? (body as JsonObject) : {}

  const profilePatch = pickAllowed(input.profile, SELF_SERVICE_PROFILE_KEYS)
  const producerPatch = pickAllowed(input.producerProfile, SELF_SERVICE_PRODUCER_PROFILE_KEYS)

  const result: SelfServiceUserPatch = {}

  if (Object.keys(profilePatch).length > 0) {
    result.profile = {
      ...((current.profile as JsonObject) ?? {}),
      ...profilePatch,
    }
  }

  if (Object.keys(producerPatch).length > 0) {
    result.producerProfile = {
      ...((current.producerProfile as JsonObject) ?? {}),
      ...producerPatch,
    }
  }

  const canSetEvergreen = current.isAdmin || current.isProducer
  if (canSetEvergreen && input.isProducer !== undefined) {
    result.isProducer = Boolean(input.isProducer)
  }

  if (current.isAdmin && input.isAdmin !== undefined) {
    result.isAdmin = Boolean(input.isAdmin)
  }

  return result
}

export function selfServicePatchHasUpdates(patch: SelfServiceUserPatch): boolean {
  return (
    patch.profile !== undefined ||
    patch.producerProfile !== undefined ||
    patch.isProducer !== undefined ||
    patch.isAdmin !== undefined
  )
}
