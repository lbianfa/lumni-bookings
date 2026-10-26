import type { BookingStep } from '../booking.types'

const STEPS: { step: BookingStep; title: string }[] = [
  { step: 1, title: 'Your details' },
  { step: 2, title: 'Room & schedule' },
  { step: 3, title: 'Services & confirm' },
]

interface BookingStepperProps {
  /** The step on screen. */
  step: BookingStep
  /** The furthest step the draft has reached: every step before it is saved. */
  reachedStep: BookingStep
  /** Only earlier steps can be opened from here; moving forward saves the current one. */
  onStepChange: (step: BookingStep) => void
}

export function BookingStepper({
  step: current,
  reachedStep,
  onStepChange,
}: BookingStepperProps) {
  return (
    <nav aria-label="Booking steps">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {STEPS.map(({ step, title }) => {
          const isCurrent = step === current
          const isDone = step < reachedStep && !isCurrent
          return (
            <li
              key={step}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex flex-[1_1_200px] items-center gap-3 rounded-xl bg-white px-4 py-3.5 ${
                isCurrent ? 'border-2 border-brand' : 'border border-line'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-bold ${
                  isCurrent
                    ? 'bg-brand text-white'
                    : isDone
                      ? 'bg-brand-tint text-brand-strong'
                      : 'bg-neutral-tint text-ink-soft'
                }`}
              >
                {isDone ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-muted">
                  Step {step} of 3{isDone && ' · Done'}
                </span>
                {step < current ? (
                  <button
                    type="button"
                    onClick={() => onStepChange(step)}
                    className="p-0 text-left text-[15px] font-semibold text-brand-strong underline hover:text-brand-deep"
                  >
                    {title}
                  </button>
                ) : (
                  <span
                    className={
                      isCurrent
                        ? 'text-[15px] font-bold'
                        : 'text-[15px] font-semibold text-ink-soft'
                    }
                  >
                    {title}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
