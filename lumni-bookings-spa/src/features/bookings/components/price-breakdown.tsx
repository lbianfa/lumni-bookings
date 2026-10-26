import { formatCop, formatHours } from '../../quotes/format'

interface PriceBreakdownProps {
  price: {
    base: string
    discountPercent: number
    discount: string
    surchargePercent: number
    surcharge: string
    services?: { code: string; name: string; price: string }[]
    total: string
  }
  durationMinutes: number
  hourlyRate: string
  /** A bigger total, for the summary next to the confirm button. */
  largeTotal?: boolean
}

export function PriceBreakdown({
  price,
  durationMinutes,
  hourlyRate,
  largeTotal = false,
}: PriceBreakdownProps) {
  const discounted = price.discountPercent > 0
  const surcharged = price.surchargePercent > 0

  return (
    <dl className="m-0 flex flex-col gap-3 text-sm">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-ink-soft">
          Base · {formatHours(durationMinutes)} × {formatCop(hourlyRate)}
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
        </dt>
        <dd className="m-0 font-mono whitespace-nowrap text-brand-strong">
          {discounted ? `− ${formatCop(price.discount)}` : formatCop('0')}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-ink-soft">
          {surcharged
            ? `Saturday surcharge (${price.surchargePercent}%)`
            : 'Saturday surcharge'}
        </dt>
        <dd className="m-0 font-mono whitespace-nowrap">
          {surcharged ? `+ ${formatCop(price.surcharge)}` : formatCop('0')}
        </dd>
      </div>
      {price.services?.map((service) => (
        <div
          key={service.code}
          className="flex items-baseline justify-between gap-4"
        >
          <dt className="text-ink-soft">{service.name}</dt>
          <dd className="m-0 font-mono whitespace-nowrap">
            + {formatCop(service.price)}
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className={largeTotal ? 'text-base font-bold' : 'font-bold'}>
          Total
        </dt>
        <dd
          className={`m-0 font-mono font-medium whitespace-nowrap ${largeTotal ? 'text-2xl' : 'text-xl'}`}
        >
          {formatCop(price.total)}
        </dd>
      </div>
    </dl>
  )
}
