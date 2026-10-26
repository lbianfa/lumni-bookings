import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// The admin's pages. The API answers 403 to anyone else; here they just go back to the home page.
export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'admin') throw redirect({ to: '/' })
  },
  component: Outlet,
})
