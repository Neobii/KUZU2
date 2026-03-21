/** Values compatible with `<input type="datetime-local">` and react-hook-form string fields (local wall time). */

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
