import type { Credentials } from '../auth.types'

const DEMO_PASSWORD = 'lumni-demo'

const DEMO_ACCOUNTS = [
  { label: 'Continue as customer', email: 'customer@lumni.test' },
  { label: 'Continue as admin', email: 'admin@lumni.test' },
] as const

interface DemoAccountsProps {
  disabled: boolean
  onSelect: (credentials: Credentials) => void
}

export function DemoAccounts({ disabled, onSelect }: DemoAccountsProps) {
  return (
    <section
      aria-labelledby="demo-title"
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-line-strong p-5"
    >
      <h2 id="demo-title" className="m-0 text-sm font-bold">
        Demo accounts
      </h2>
      <p className="m-0 text-[13px] leading-normal text-muted">
        Two seeded users are available for this demo.
      </p>
      <div className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map(({ label, email }) => (
          <button
            key={email}
            type="button"
            disabled={disabled}
            onClick={() => onSelect({ email, password: DEMO_PASSWORD })}
            className="flex min-h-11 flex-[1_1_160px] items-center justify-center rounded-[10px] border border-brand bg-transparent text-sm font-semibold text-brand-strong hover:bg-brand-tint disabled:cursor-not-allowed disabled:opacity-60"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
