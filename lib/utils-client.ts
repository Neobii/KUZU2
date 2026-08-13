import moment from 'moment'
import { formatStationSimpleTime } from '@/lib/datetime-local'

export function prettifySimpleTime(date: Date | string | null | undefined): string {
  return formatStationSimpleTime(date)
}

export function prettifyDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('MMM DD')
}
