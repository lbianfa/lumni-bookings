import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { ApiError } from '../auth/api'
import type { Credentials } from '../auth/api'
import { meQueryOptions, useLoginMutation } from '../auth/queries'
import { safeRedirect } from '../auth/redirect'

const DEMO_PASSWORD = 'lumni-demo'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const target = safeRedirect(search.redirect)
    return target ? { redirect: target } : {}
  },
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions)
    if (user) {
      throw redirect({ href: search.redirect ?? '/' })
    }
  },
  component: LoginPage,
})

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 401) return error.message
  return 'Something went wrong. Please try again.'
}

function validateEmail(value: string) {
  if (!value.trim()) return 'Email is required'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address'
  return undefined
}

function validatePassword(value: string) {
  return value ? undefined : 'Password is required'
}

function LoginPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const login = useLoginMutation()

  const signIn = (credentials: Credentials) =>
    login.mutate(credentials, {
      onSuccess: () => navigate({ href: search.redirect ?? '/' }),
    })

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: ({ value }) =>
      signIn({ email: value.email.trim(), password: value.password }),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 text-ink">
      <main className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex items-center gap-2.5 text-xl font-bold">
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-[9px] bg-brand text-[17px] text-white"
          >
            L
          </span>
          Lumni
        </div>

        <section
          aria-labelledby="signin-title"
          className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-8"
        >
          <div className="flex flex-col gap-1.5">
            <h1
              id="signin-title"
              className="m-0 text-[28px] font-bold tracking-[-0.02em]"
            >
              Sign in
            </h1>
            <p className="m-0 text-[15px] text-muted">
              Book rooms and manage your reservations.
            </p>
          </div>

          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) => validateEmail(value),
                onSubmit: ({ value }) => validateEmail(value),
              }}
            >
              {(field) => (
                <TextField
                  id="signin-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={field.state.value}
                  error={field.state.meta.errors[0]}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) => validatePassword(value),
                onSubmit: ({ value }) => validatePassword(value),
              }}
            >
              {(field) => (
                <TextField
                  id="signin-password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  error={field.state.meta.errors[0]}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>

            {login.isError && (
              <p
                role="alert"
                className="m-0 rounded-[10px] border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger"
              >
                {errorMessage(login.error)}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              aria-busy={login.isPending}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign in
            </button>
          </form>
        </section>

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
            <DemoButton
              disabled={login.isPending}
              onClick={() =>
                signIn({
                  email: 'customer@lumni.test',
                  password: DEMO_PASSWORD,
                })
              }
            >
              Continue as customer
            </DemoButton>
            <DemoButton
              disabled={login.isPending}
              onClick={() =>
                signIn({ email: 'admin@lumni.test', password: DEMO_PASSWORD })
              }
            >
              Continue as admin
            </DemoButton>
          </div>
        </section>
      </main>
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  autoComplete: string
  placeholder?: string
  value: string
  error: string | undefined
  onBlur: () => void
  onChange: (value: string) => void
}

function TextField({ id, label, error, onChange, ...input }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-[10px] border border-line-strong bg-white px-3.5 text-[15px] text-ink aria-invalid:border-danger"
        {...input}
      />
      {error && (
        <p id={errorId} role="alert" className="m-0 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function DemoButton({
  children,
  disabled,
  onClick,
}: {
  children: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 flex-[1_1_160px] items-center justify-center rounded-[10px] border border-brand bg-transparent text-sm font-semibold text-brand-strong hover:bg-brand-tint disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}
