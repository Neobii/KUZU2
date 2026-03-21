/** Match Meteor Post.visibleBy: admin | pioneer | evergreen | public */
export function canSeePost(
  viewer: {
    isAdmin?: boolean
    isProducer?: boolean
    producerProfile?: { isPioneer?: boolean }
  } | null,
  visibleBy: unknown
): boolean {
  if (viewer?.isAdmin) return true
  const roles = Array.isArray(visibleBy) ? (visibleBy as string[]) : ['public']
  if (!roles.length) return true
  if (roles.includes('public')) return true
  if (!viewer) return false
  if (viewer.isAdmin && roles.includes('admin')) return true
  if (viewer.isAdmin) return true
  const pioneer = viewer.producerProfile?.isPioneer
  if (roles.includes('pioneer') && pioneer) return true
  if (roles.includes('evergreen') && viewer.isProducer && !pioneer) return true
  return false
}
