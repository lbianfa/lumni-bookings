import { useState } from 'react'
import type { Booking } from '../booking.types'
import { BackToQuoteLink } from './back-to-quote-link'
import { BookingHeader } from './booking-header'
import { BookingStepper } from './booking-stepper'
import { CustomerStep } from './steps/customer-step'
import { ScheduleStep } from './steps/schedule-step'
import { ServicesStep } from './steps/services-step'

interface BookingWizardProps {
  /** A draft: only drafts can be edited. */
  booking: Booking
  /** Called once the booking is confirmed from step 3. */
  onConfirmed: () => void
}

export function BookingWizard({ booking, onConfirmed }: BookingWizardProps) {
  // Opens on the furthest step reached, so a reopened draft resumes there.
  const [step, setStep] = useState(booking.currentStep)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {step === 1 && <BackToQuoteLink />}
      <BookingHeader
        status={booking.status}
        reference={booking.reference}
        title={`Book ${booking.room.name}`}
        saved={saved}
      />
      <BookingStepper
        step={step}
        reachedStep={booking.currentStep}
        onStepChange={setStep}
      />
      {step === 1 && (
        <CustomerStep
          booking={booking}
          onSaved={() => {
            setSaved(true)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <ScheduleStep
          booking={booking}
          onBack={() => setStep(1)}
          onSaved={() => {
            setSaved(true)
            setStep(3)
          }}
        />
      )}
      {step === 3 && (
        <ServicesStep
          booking={booking}
          onBack={() => setStep(2)}
          onSaved={() => setSaved(true)}
          onConfirmed={onConfirmed}
        />
      )}
    </div>
  )
}
