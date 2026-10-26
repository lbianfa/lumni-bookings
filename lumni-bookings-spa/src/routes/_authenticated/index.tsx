import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useLocation } from '@tanstack/react-router'
import '../../auth/signed-in-state'
import { myBookingsQueryOptions } from '../../features/bookings/queries'
import { QuickActionCard } from '../../features/home/components/quick-action-card'
import { ResumeDraftCard } from '../../features/home/components/resume-draft-card'
import { SignedInNotice } from '../../features/home/components/signed-in-notice'

export const Route = createFileRoute('/_authenticated/')({
  // The draft reminder is optional: its bookings load without holding the page back or failing it.
  loader: ({ context }) => {
    if (context.user.role === 'customer') {
      void context.queryClient.prefetchQuery(myBookingsQueryOptions)
    }
  },
  component: HomePage,
})

function HomePage() {
  const { user } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const signedIn = useLocation({ select: (l) => l.state.signedIn === true })

  // Clearing the flag in the history entry keeps the notice away after a reload too.
  const dismissNotice = () =>
    navigate({
      to: '/',
      replace: true,
      state: (state) => ({ ...state, signedIn: false }),
    })

  return (
    <div className="flex flex-col gap-8 pt-2">
      {signedIn && <SignedInNotice onDismiss={dismissNotice} />}

      <section aria-labelledby="welcome-title" className="flex flex-col gap-2">
        <h1
          id="welcome-title"
          className="m-0 text-[40px] leading-[1.15] font-bold tracking-[-0.02em] [overflow-wrap:anywhere]"
        >
          Welcome back, {user.email}
        </h1>
        <p className="m-0 max-w-[640px] text-[17px] leading-normal text-muted">
          What would you like to do today?
        </p>
      </section>

      {user.role === 'customer' ? <CustomerActions /> : <AdminActions />}
    </div>
  )
}

const LIST_ICON = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
)

// The assistant's card comes with the assistant.
function CustomerActions() {
  const { data: bookings } = useQuery(myBookingsQueryOptions)
  // Newest created first, so the first draft is the latest one.
  const draft = bookings?.find((booking) => booking.status === 'draft')

  return (
    <>
      <section
        aria-label="Quick actions"
        className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5"
      >
        <QuickActionCard
          to="/quote"
          primary
          title="Quote a room"
          description="Pick a room, a day and a time, and see the exact price."
          icon={
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M3 9h18" />
              <path d="M8 2v4" />
              <path d="M16 2v4" />
            </svg>
          }
        />
        <QuickActionCard
          to="/bookings"
          title="My bookings"
          description="Resume a draft or check the details of a confirmed booking."
          icon={LIST_ICON}
        />
      </section>

      {draft && <ResumeDraftCard draft={draft} />}
    </>
  )
}

function AdminActions() {
  return (
    <section
      aria-label="Quick actions"
      className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5"
    >
      <QuickActionCard
        to="/admin/bookings"
        primary
        title="Bookings"
        description="Filter every customer's bookings by status and room, and open their details."
        icon={LIST_ICON}
      />
    </section>
  )
}
