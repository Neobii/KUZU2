import moment from 'moment'
import { formatStationSimpleTime } from '@/lib/datetime-local'

export function prettifyTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('hh:mm:ss')
}

export function prettifyDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('MMM DD')
}

export function prettifySimpleTime(date: Date | string | null | undefined): string {
  return formatStationSimpleTime(date)
}

export function getEmail(emails?: { address: string }[]): string {
  return emails?.[0]?.address ?? ''
}
