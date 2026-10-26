import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()

  return (
    <>
      <h1 className="m-0 text-4xl leading-tight font-bold tracking-[-0.02em]">
        Welcome back
      </h1>
      <p className="mt-2 max-w-[640px] text-base leading-normal text-muted">
        You are signed in as {user.email}.
      </p>
    </>
  )
}
