import { useForm } from '@tanstack/react-form'
import type { Credentials } from '../auth.types'
import { TextField } from './text-field'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string) {
  if (!value.trim()) return 'Email is required'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address'
  return undefined
}

function validatePassword(value: string) {
  return value ? undefined : 'Password is required'
}

interface LoginFormProps {
  isPending: boolean
  error: string | undefined
  onSubmit: (credentials: Credentials) => void
}

export function LoginForm({ isPending, error, onSubmit }: LoginFormProps) {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: ({ value }) =>
      onSubmit({ email: value.email.trim(), password: value.password }),
  })

  return (
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

      {error && (
        <p
          role="alert"
          className="m-0 rounded-[10px] border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        Sign in
      </button>
    </form>
  )
}
