import { Link } from '@tanstack/react-router'

interface MyBookingsLinkProps {
  /** A back arrow instead of the list icon, for a page opened from My bookings. */
  back?: boolean
}

export function MyBookingsLink({ back = false }: MyBookingsLinkProps) {
  return (
    <Link
      to="/bookings"
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand-strong no-underline hover:text-brand-deep"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {back ? (
          <>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </>
        ) : (
          <>
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6h.01" />
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
          </>
        )}
      </svg>
      My bookings
    </Link>
  )
}
