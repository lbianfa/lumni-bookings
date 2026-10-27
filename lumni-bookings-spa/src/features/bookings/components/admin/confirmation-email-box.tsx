import { formatClock, formatMoment } from '../../../quotes/business-time'
import type { BookingEmail, EmailStatus } from '../../booking.types'

const STATUS_STYLES: Record<EmailStatus, string> = {
  pending: 'bg-neutral-tint text-ink-soft',
  sent: 'bg-brand-tint text-brand-strong',
  failed: 'bg-danger-tint text-danger',
}

const STATUS_LABELS: Record<EmailStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
}

/** `30 s`, `2 min`, `1 h`: the wait between two attempts. */
function formatWait(from: string, to: string): string {
  const seconds = Math.round((Date.parse(to) - Date.parse(from)) / 1000)
  if (seconds < 60) return `${seconds} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${Math.round(seconds / 3600)} h`
}

function Summary({ email }: { email: BookingEmail }) {
  if (email.status === 'pending') return <>Waiting to be sent.</>
  if (email.status === 'sent') {
    return (
      <>
        Sent to {email.toAddress}
        {email.sentAt && <> · {formatMoment(email.sentAt)}</>}.
      </>
    )
  }
  return (
    <>
      {email.attemptCount === 1
        ? 'The attempt failed.'
        : `All ${email.attemptCount} attempts failed.`}
      {email.lastError && (
        <>
          {' '}
          Last error:{' '}
          <span className="font-mono text-[13px] [overflow-wrap:anywhere]">
            {email.lastError}
          </span>
        </>
      )}
    </>
  )
}

// The admin's indicator of the booking's confirmation email: its status and every send attempt.
export function ConfirmationEmailBox({ email }: { email: BookingEmail }) {
  return (
    <section
      aria-labelledby="email-title"
      className="box-border flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl border border-line bg-white p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="email-title"
          className="m-0 inline-flex items-center gap-2 text-base font-bold"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          Confirmation email
        </h2>
        <span
          className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold ${STATUS_STYLES[email.status]}`}
        >
          {STATUS_LABELS[email.status]}
        </span>
      </div>
      <p className="m-0 text-sm leading-normal text-ink-soft [overflow-wrap:anywhere]">
        <Summary email={email} />
      </p>
      {email.attempts.length > 0 && (
        <ol className="m-0 flex list-none flex-col p-0 text-[13px]">
          {email.attempts.map((attempt, index) => (
            // The list only grows at its end, so the position is a stable key (two attempts may share a timestamp).
            <li
              key={index}
              className="flex justify-between gap-3 border-t border-line py-2.5 last:border-b"
            >
              <span>
                Attempt {index + 1}
                {index > 0 && (
                  <span className="text-muted">
                    {' '}
                    · after{' '}
                    {formatWait(
                      email.attempts[index - 1].attemptedAt,
                      attempt.attemptedAt,
                    )}
                  </span>
                )}
              </span>
              <span className="font-mono text-ink-soft">
                {formatClock(attempt.attemptedAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
