import { createFileRoute, redirect } from '@tanstack/react-router'
import { ApiError } from '../api/http-client'
import type { Credentials } from '../auth/auth.types'
import { DemoAccounts } from '../auth/components/demo-accounts'
import { LoginForm } from '../auth/components/login-form'
import { meQueryOptions, useLoginMutation } from '../auth/queries'
import { safeRedirect } from '../auth/redirect'

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

function LoginPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const login = useLoginMutation()

  const signIn = (credentials: Credentials) =>
    login.mutate(credentials, {
      onSuccess: () => navigate({ href: search.redirect ?? '/' }),
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
          <LoginForm
            isPending={login.isPending}
            error={login.isError ? errorMessage(login.error) : undefined}
            onSubmit={signIn}
          />
        </section>

        <DemoAccounts disabled={login.isPending} onSelect={signIn} />
      </main>
    </div>
  )
}
