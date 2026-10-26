import { useRef, useState } from 'react'

/** `31/10/2026` for `2026-10-31`: day, month and year, as dates are written in Colombia. */
function toDayMonthYear(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/** `2026-10-31` for `31/10/2026`, or `undefined` when the text is not a real calendar date. */
function parseDayMonthYear(text: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim())
  if (!match) return undefined
  const isoDate = `${match[3]}-${match[2]}-${match[1]}`
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  // Rejects dates that roll over, such as 31/02/2026.
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== isoDate
  ) {
    return undefined
  }
  return isoDate
}

interface DateFieldProps {
  id: string
  label: string
  /** `YYYY-MM-DD`. */
  value: string
  /** Earliest allowed date, `YYYY-MM-DD`. */
  min: string
  className: string
  onChange: (value: string) => void
}

// The native date input shows the browser's locale format, which a page cannot change.
// This field always shows dd/mm/yyyy and keeps the browser's calendar behind a button.
export function DateField({
  id,
  label,
  value,
  min,
  className,
  onChange,
}: DateFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(() => toDayMonthYear(value))
  const [error, setError] = useState<string>()
  // Follows the value when it changes from outside: the calendar, or the page normalizing a past date.
  const [shownValue, setShownValue] = useState(value)
  if (value !== shownValue) {
    setShownValue(value)
    setText(toDayMonthYear(value))
    setError(undefined)
  }

  const validate = (input: string): string | undefined => {
    const isoDate = parseDayMonthYear(input)
    if (!isoDate) return 'Enter the date as dd/mm/yyyy.'
    if (isoDate < min) return 'Pick today or a later date.'
    return undefined
  }

  const handleTextChange = (input: string) => {
    setText(input)
    const isoDate = parseDayMonthYear(input)
    if (isoDate && isoDate >= min) {
      setError(undefined)
      if (isoDate !== value) onChange(isoDate)
    }
  }

  const openCalendar = () => {
    try {
      pickerRef.current?.showPicker()
    } catch {
      // Browsers without showPicker() still let the customer type the date.
    }
  }

  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative flex">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          maxLength={10}
          required
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          onChange={(event) => handleTextChange(event.target.value)}
          onBlur={() => setError(validate(text))}
          className={`${className} w-full min-w-0 pr-12 font-mono aria-invalid:border-danger`}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={openCalendar}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-ink-soft hover:text-ink"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
        </button>
        {/* Only the source of the browser's calendar: hidden, but laid over the field so the calendar opens below it. */}
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min={min}
          value={value}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value)
          }}
          className="pointer-events-none absolute inset-0 opacity-0"
        />
      </div>
      <p id={hintId} className="sr-only">
        Day, month and year, for example 31/10/2026.
      </p>
      {error && (
        <p id={errorId} role="alert" className="m-0 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
