import { Link } from '@tanstack/react-router'

export function BackToQuoteLink() {
  return (
    <Link
      to="/quote"
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
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      Back to quote
    </Link>
  )
}
