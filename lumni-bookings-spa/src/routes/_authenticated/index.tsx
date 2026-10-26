import { createFileRoute } from '@tanstack/react-router'
import { useLogoutMutation } from '../../auth/queries'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const logout = useLogoutMutation()

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/login' }),
    })

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-2 px-6 py-2">
          <span className="inline-flex min-h-11 items-center gap-2.5 text-lg font-bold">
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-brand text-[15px] text-white"
            >
              L
            </span>
            Lumni
          </span>
          <div className="ml-auto flex items-center gap-2.5 text-sm text-ink-soft">
            <span>{user.email}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-brand-strong capitalize">
              {user.role}
            </span>
            <button
              type="button"
              onClick={signOut}
              disabled={logout.isPending}
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand-strong hover:text-brand-deep disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 pt-10 pb-18">
        <h1 className="m-0 text-4xl leading-tight font-bold tracking-[-0.02em]">
          Welcome back
        </h1>
        <p className="mt-2 max-w-[640px] text-base leading-normal text-muted">
          You are signed in as {user.email}.
        </p>
        {logout.isError && (
          <p role="alert" className="mt-4 text-sm text-danger">
            Could not sign out. Please try again.
          </p>
        )}
      </main>
    </div>
  )
}
