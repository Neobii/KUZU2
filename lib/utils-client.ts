import moment from 'moment'

export function prettifySimpleTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('h:mm a')
}
