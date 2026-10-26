import { Link } from '@tanstack/react-router'

export function MyBookingsLink() {
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
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
      My bookings
    </Link>
  )
}
