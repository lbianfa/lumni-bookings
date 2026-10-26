import { SIZE_LABELS, formatCop, formatHours } from '../format'
import type { Quote } from '../quote.types'

interface QuoteSummaryProps {
  /** The selection the panel describes, shown even before the first quote arrives. */
  heading: string
  quote: Quote | undefined
  /** Shown while there is no quote, e.g. while the first one loads. */
  pendingMessage: string
  isUpdating: boolean
  errorMessage: string | undefined
  onUseSuggestion: (startTime: string) => void
}

export function QuoteSummary({
  heading,
  quote,
  pendingMessage,
  isUpdating,
  errorMessage,
  onUseSuggestion,
}: QuoteSummaryProps) {
  return (
    <aside
      aria-labelledby="quote-title"
      aria-busy={isUpdating}
      className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 rounded-2xl border border-line bg-white p-7"
    >
      <div className="flex flex-col gap-1">
        <h2 id="quote-title" className="m-0 text-xl font-bold">
          Quote
        </h2>
        <p className="m-0 text-sm text-muted">{heading}</p>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="m-0 rounded-xl bg-danger-tint px-4 py-3.5 text-sm text-danger"
        >
          {errorMessage}
        </p>
      ) : !quote ? (
        <p role="status" className="m-0 text-sm text-muted">
          {pendingMessage}
        </p>
      ) : (
        <QuoteDetails quote={quote} onUseSuggestion={onUseSuggestion} />
      )}

      <p className="m-0 text-[13px] leading-normal text-muted">
        The price is locked when you confirm the booking. Confirming twice never
        charges twice.
      </p>
    </aside>
  )
}

function QuoteDetails({
  quote,
  onUseSuggestion,
}: {
  quote: Quote
  onUseSuggestion: (startTime: string) => void
}) {
  const { price, room, suggestion } = quote
  const discounted = price.discountPercent > 0
  const saturday = price.surchargePercent > 0

  return (
    <>
      <dl className="m-0 flex flex-col gap-3.5 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">
            Base · {formatHours(quote.durationMinutes)} ×{' '}
            {formatCop(room.hourlyRate)}
          </dt>
          <dd className="m-0 font-mono whitespace-nowrap">
            {formatCop(price.base)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">
            {discounted
              ? `Duration discount (${price.discountPercent}%)`
              : 'Duration discount'}
            <br />
            <span className="text-xs text-muted">
              {discounted ? 'Applied to the base price' : 'Starts at 4 hours'}
            </span>
          </dt>
          <dd className="m-0 font-mono whitespace-nowrap text-brand-strong">
            {discounted ? `− ${formatCop(price.discount)}` : formatCop('0')}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-soft">
            Saturday surcharge (25%)
            <br />
            <span className="text-xs text-muted">
              {saturday ? 'Applied after the discount' : 'Only on Saturdays'}
            </span>
          </dt>
          <dd className="m-0 font-mono whitespace-nowrap">
            {saturday ? `+ ${formatCop(price.surcharge)}` : formatCop('0')}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3.5">
          <dt className="text-base font-bold">Total</dt>
          <dd className="m-0 font-mono text-2xl font-medium whitespace-nowrap">
            {formatCop(price.total)}
          </dd>
        </div>
      </dl>

      {quote.available ? (
        <div
          role="status"
          className="flex gap-3 rounded-xl bg-brand-tint px-4 py-3.5 text-brand-strong"
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
            className="mt-0.5 flex-none"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div>
            <p className="m-0 font-bold">Available</p>
            <p className="mt-1 mb-0 text-sm leading-snug">
              {room.name} ({SIZE_LABELS[room.size]}) is free at that time.
            </p>
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="flex gap-3 rounded-xl bg-warning-tint px-4 py-3.5 text-warning"
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
            className="mt-0.5 flex-none"
          >
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="m-0 font-bold">Not available</p>
            <p className="mt-1 mb-0 text-sm leading-snug">
              {quote.reason?.message}
            </p>
            {suggestion && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-sm">Next free slot that day:</span>
                <button
                  type="button"
                  onClick={() => onUseSuggestion(suggestion.startTime)}
                  className="min-h-11 rounded-[10px] border border-warning bg-white px-4 font-mono text-sm font-medium text-warning"
                >
                  Use {suggestion.startTime}–{suggestion.endTime}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
