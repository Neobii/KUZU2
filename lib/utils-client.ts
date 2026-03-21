import moment from 'moment'

export function prettifySimpleTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('h:mm a')
}

export function prettifyDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  return moment(date).format('MMM DD')
}
