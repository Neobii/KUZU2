/** Values compatible with `<input type="datetime-local">` and react-hook-form string fields (local wall time). */

export function dateToLocalDatetimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Convert inclusive `YYYY-MM-DD` calendar picks (local) into `[from, toExclusive)`
 * bounds for playDate queries that use `gte` / `lt`.
 *
 * Example: From=2026-08-01, To=2026-08-07 includes all of Aug 7 local time.
 */
export function inclusiveLocalDateRangeToExclusiveBounds(
  dateFrom: string,
  dateTo: string
): { from: Date; toExclusive: Date } | null {
  const fromMatch = LOCAL_DATE_RE.exec(dateFrom.trim())
  const toMatch = LOCAL_DATE_RE.exec(dateTo.trim())
  if (!fromMatch || !toMatch) return null

  const from = new Date(+fromMatch[1], +fromMatch[2] - 1, +fromMatch[3], 0, 0, 0, 0)
  const toStart = new Date(+toMatch[1], +toMatch[2] - 1, +toMatch[3], 0, 0, 0, 0)
  if (Number.isNaN(from.getTime()) || Number.isNaN(toStart.getTime())) return null
  if (toStart < from) return null

  const toExclusive = new Date(toStart)
  toExclusive.setDate(toExclusive.getDate() + 1)
  return { from, toExclusive }
}

/** Parse stored ISO (UTC) from API into local `YYYY-MM-DDTHH:mm` for forms. */
export function isoToLocalDatetimeInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return dateToLocalDatetimeInputValue(d)
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
