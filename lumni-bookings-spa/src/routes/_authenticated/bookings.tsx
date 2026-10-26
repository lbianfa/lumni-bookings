import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// The customer's own bookings (My bookings and the booking pages). The admin has no customer, and the API
// answers 403 to it; here it just goes back to the home page.
export const Route = createFileRoute('/_authenticated/bookings')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'customer') throw redirect({ to: '/' })
  },
  component: Outlet,
})
