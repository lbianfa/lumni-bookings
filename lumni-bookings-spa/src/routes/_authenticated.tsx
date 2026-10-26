import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { meQueryOptions, useLogoutMutation } from '../auth/queries'
import { AppLayout } from '../layout/app-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions)
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const logout = useLogoutMutation()

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/login' }),
    })

  return (
    <AppLayout
      user={user}
      isSigningOut={logout.isPending}
      signOutFailed={logout.isError}
      onSignOut={signOut}
    >
      <Outlet />
    </AppLayout>
  )
}
