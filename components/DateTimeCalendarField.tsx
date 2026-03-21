'use client'

import DatePicker from 'react-datepicker'
import { dateToLocalDatetimeInputValue, parseLocalDatetimeInputValue } from '@/lib/datetime-local'
import { inputClass } from '@/lib/ui'
import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * Calendar + time picker for local datetime strings (`YYYY-MM-DDTHH:mm`), e.g. edit show start/end.
 */
export function DateTimeCalendarField({
  value,
  onChange,
  id,
  placeholder = 'Select date and time',
  disabled,
}: Props) {
  const selected = parseLocalDatetimeInputValue(value)

  return (
    <DatePicker
      id={id}
      selected={selected}
      onChange={(date: Date | null) => {
        onChange(date ? dateToLocalDatetimeInputValue(date) : '')
      }}
      showTimeSelect
      timeIntervals={15}
      dateFormat="MMM d, yyyy h:mm aa"
      placeholderText={placeholder}
      disabled={disabled}
      isClearable
      toggleCalendarOnIconClick
      showIcon
      className={inputClass}
      wrapperClassName="w-full kuzu-datepicker-wrap"
      calendarClassName="kuzu-datepicker-calendar"
      popperClassName="kuzu-datepicker-popper"
      popperPlacement="bottom-start"
    />
  )
}
