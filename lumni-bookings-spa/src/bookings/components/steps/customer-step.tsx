import { useForm } from '@tanstack/react-form'
import { formatDateLabel } from '../../../quotes/business-time'
import { SIZE_LABELS, formatCop } from '../../../quotes/format'
import type { Booking } from '../../booking.types'
import { bookingErrorMessage } from '../../errors'
import { useSaveCustomerMutation } from '../../queries'
import { TextField } from '../../../auth/components/text-field'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateFullName(value: string) {
  return value.trim() ? undefined : 'Full name is required'
}

function validateEmail(value: string) {
  if (!value.trim()) return 'Email is required'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address'
  return undefined
}

interface CustomerStepProps {
  booking: Booking
  onSaved: () => void
}

export function CustomerStep({ booking, onSaved }: CustomerStepProps) {
  const save = useSaveCustomerMutation(booking.id)
  const form = useForm({
    defaultValues: {
      fullName: booking.customer.fullName,
      email: booking.customer.email,
      company: booking.customer.company ?? '',
    },
    onSubmit: ({ value }) =>
      save.mutate(
        {
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          company: value.company.trim() || null,
        },
        { onSuccess: onSaved },
      ),
  })

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section
        aria-labelledby="details-title"
        className="min-w-0 flex-[999_1_560px] rounded-2xl border border-line bg-white p-7"
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex flex-col gap-1">
            <h2 id="details-title" className="m-0 text-xl font-bold">
              Your details
            </h2>
            <p className="m-0 text-sm text-muted">
              We send the confirmation to this email.
            </p>
          </div>

          <form.Field
            name="fullName"
            validators={{
              onBlur: ({ value }) => validateFullName(value),
              onSubmit: ({ value }) => validateFullName(value),
            }}
          >
            {(field) => (
              <TextField
                id="customer-name"
                label="Full name"
                type="text"
                autoComplete="name"
                value={field.state.value}
                error={field.state.meta.errors[0]}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => validateEmail(value),
              onSubmit: ({ value }) => validateEmail(value),
            }}
          >
            {(field) => (
              <TextField
                id="customer-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                error={field.state.meta.errors[0]}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <form.Field name="company">
            {(field) => (
              <TextField
                id="customer-company"
                label="Company"
                type="text"
                autoComplete="organization"
                optional
                value={field.state.value}
                error={undefined}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>

          {save.error && (
            <p
              role="alert"
              className="m-0 rounded-[10px] border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger"
            >
              {bookingErrorMessage(save.error)}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
            <button
              type="submit"
              disabled={save.isPending}
              aria-busy={save.isPending}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save and continue
            </button>
          </div>
        </form>
      </section>

      <aside
        aria-labelledby="snapshot-title"
        className="flex min-w-0 flex-[1_1_340px] flex-col gap-4"
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <h2 id="snapshot-title" className="m-0 text-base font-bold">
            Your quote
          </h2>
          <dl className="m-0 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Room</dt>
              <dd className="m-0 font-semibold">
                {booking.room.name} ({SIZE_LABELS[booking.room.size]})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Date</dt>
              <dd className="m-0 font-semibold">
                {formatDateLabel(booking.date)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Time</dt>
              <dd className="m-0 font-mono">
                {booking.startTime}–{booking.endTime}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-2.5">
              <dt className="font-bold">Total</dt>
              <dd className="m-0 font-mono font-medium">
                {formatCop(booking.price.total)}
              </dd>
            </div>
          </dl>
        </div>
        <p className="m-0 rounded-xl bg-neutral-tint p-4 text-[13px] leading-normal text-ink-soft">
          Each step is saved as a draft. You can close this page and pick up
          where you left off by opening it again.
        </p>
      </aside>
    </div>
  )
}
