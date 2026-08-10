import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

/** Mirrors legacy Meteor `getCurrentAdditionalInfo`. */
export async function getCurrentAdditionalInfo(): Promise<string> {
  const [productionStatus, show] = await Promise.all([
    prisma.productionStatus.findFirst({ where: { isActive: true } }),
    prisma.show.findFirst({ where: { isActive: true } }),
  ])

  if (productionStatus?.isShowingAdditionalContent) {
    return productionStatus.additionalContent ?? ' '
  }
  if (show?.isShowingDescription) {
    return show.description ?? ' '
  }
  return ' '
}

export function hashAdditionalInfo(content: string): string {
  return createHash('sha1').update(content).digest('hex')
}

export const trackingCorsHeaders = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}
