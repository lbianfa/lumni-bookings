import { formatCop } from '../../../quotes/format'
import type { Booking, BookingService } from '../../booking.types'
import { bookingErrorMessage } from '../../errors'
import { useConfirmBookingMutation, useSaveServicesMutation } from '../../queries'
import { BookingSummary } from '../booking-summary'

// Icons for the seeded services (README D-14); any other service shows the generic one.
function ServiceIcon({ code }: { code: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {code === 'projector' ? (
        <>
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <circle cx="16" cy="12" r="2.5" />
          <path d="M6 17v2M18 17v2" />
        </>
      ) : code === 'coffee' ? (
        <>
          <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
          <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M8 3v3M12 3v3" />
        </>
      ) : (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      )}
    </svg>
  )
}

interface ServicesStepProps {
  booking: Booking
  onBack: () => void
  onSaved: () => void
}

export function ServicesStep({ booking, onBack, onSaved }: ServicesStepProps) {
  const saveServices = useSaveServicesMutation(booking.id)
  const confirm = useConfirmBookingMutation(booking.id)
  const busy = saveServices.isPending || confirm.isPending

  // Each change is saved at once; the API answers with the booking priced again.
  const toggle = (service: BookingService) => {
    const serviceIds = booking.services
      .filter((candidate) =>
        candidate.id === service.id ? !candidate.selected : candidate.selected,
      )
      .map((candidate) => candidate.id)
    confirm.reset()
    saveServices.mutate(serviceIds, { onSuccess: onSaved })
  }

  const error = saveServices.error ?? confirm.error

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section
        aria-labelledby="services-title"
        className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-2xl border border-line bg-white p-7"
      >
        <div className="flex flex-col gap-1">
          <h2 id="services-title" className="m-0 text-xl font-bold">
            Additional services
          </h2>
          <p className="m-0 text-sm text-muted">
            Optional. Add them now or skip this step.
          </p>
        </div>
        <fieldset
          disabled={busy}
          aria-busy={saveServices.isPending}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
        >
          <legend className="sr-only">Additional services</legend>
          {booking.services.map((service) => (
            <label
              key={service.id}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-line-strong p-[18px] has-checked:border-brand"
            >
              <input
                type="checkbox"
                name="services"
                value={service.code}
                checked={service.selected}
                onChange={() => toggle(service)}
                className="m-0 size-[22px] flex-none accent-brand"
              />
              <span className="inline-flex size-10 flex-none items-center justify-center rounded-[10px] bg-neutral-tint text-ink-soft">
                <ServiceIcon code={service.code} />
              </span>
              <span className="flex-1 text-[15px] font-semibold">
                {service.name}
              </span>
              <span className="font-mono text-sm text-ink-soft">
                {formatCop(service.price)}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap justify-start gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink"
          >
            Back
          </button>
        </div>
      </section>

      <BookingSummary booking={booking}>
        {error && (
          <p
            role="alert"
            className="m-0 rounded-[10px] border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger"
          >
            {bookingErrorMessage(error)}
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          aria-busy={confirm.isPending}
          onClick={() => {
            saveServices.reset()
            confirm.mutate()
          }}
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm booking
        </button>
        <p className="m-0 text-[13px] leading-normal text-muted">
          Once confirmed, this price is locked. Clicking twice will not create a
          second booking.
        </p>
      </BookingSummary>
    </div>
  )
}
