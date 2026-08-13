/** Values compatible with `<input type="datetime-local">` and react-hook-form string fields (local wall time). */

/** KUZU stream / station calendar (Denton, TX). */
export const KUZU_STATION_TIMEZONE = 'America/Chicago'

const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Format a UTC instant as wall-clock time in the station timezone. */
export function formatStationSimpleTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: KUZU_STATION_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  )
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second
  )
  return asUtc - date.getTime()
}

function addCalendarDays(dateStr: string, days: number): string | null {
  const m = CALENDAR_DATE_RE.exec(dateStr.trim())
  if (!m) return null
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + days))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Midnight at the start of a calendar day in the station timezone, as a UTC instant. */
export function parseStationCalendarDayStart(
  dateStr: string,
  timeZone = KUZU_STATION_TIMEZONE
): Date | null {
  const m = CALENDAR_DATE_RE.exec(dateStr.trim())
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  const ref = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
  const offset = getTimeZoneOffsetMs(timeZone, ref)
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0) - offset)
}

/** Licensing export range: `[from, toExclusive)` in station local calendar days. */
export function parseStationExportDateRange(
  dateFrom: string,
  dateToInclusive: string,
  timeZone = KUZU_STATION_TIMEZONE
): { from: Date; toExclusive: Date } | null {
  const from = parseStationCalendarDayStart(dateFrom, timeZone)
  const nextDay = addCalendarDays(dateToInclusive, 1)
  const toExclusive = nextDay ? parseStationCalendarDayStart(nextDay, timeZone) : null
  if (!from || !toExclusive) return null
  return { from, toExclusive }
}

export function isCalendarDateString(value: string): boolean {
  return CALENDAR_DATE_RE.test(value.trim())
}

export function dateToLocalDatetimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parse stored ISO (UTC) from API into local `YYYY-MM-DDTHH:mm` for forms. */
export function isoToLocalDatetimeInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return dateToLocalDatetimeInputValue(d)
}

/** Parse `<input type="date">` value as local calendar day at 00:00:00. */
export function parseLocalDateInputValue(s: string): Date | null {
  if (!s?.trim()) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (m) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0)
    return isNaN(dt.getTime()) ? null : dt
  }
  return parseLocalDatetimeInputValue(s)
}

/** Inclusive date-only range end → exclusive upper bound (start of next local day). */
export function parseLocalDateRangeEndExclusive(s: string): Date | null {
  const dayStart = parseLocalDateInputValue(s)
  if (!dayStart) return null
  const end = new Date(dayStart)
  end.setDate(end.getDate() + 1)
  return end
}

/** Parse form value to Date in local timezone (avoids UTC misreads on `YYYY-MM-DDTHH:mm`). */
export function parseLocalDatetimeInputValue(s: string): Date | null {
  if (!s?.trim()) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s.trim())
  if (m) {
    const y = +m[1]
    const mo = +m[2] - 1
    const d = +m[3]
    const h = +m[4]
    const mi = +m[5]
    const dt = new Date(y, mo, d, h, mi, 0, 0)
    return isNaN(dt.getTime()) ? null : dt
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
