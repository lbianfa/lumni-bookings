interface SignedInNoticeProps {
  onDismiss: () => void
}

// Shown on the page the sign-in lands on; the session length is README D-19.
export function SignedInNotice({ onDismiss }: SignedInNoticeProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl bg-brand-tint py-3 pr-3 pl-4 text-sm text-brand-strong"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="flex-none"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <p className="m-0 min-w-0 flex-1 font-semibold">
        You&apos;re signed in. Your session stays active for 8 hours.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="inline-flex size-11 flex-none items-center justify-center rounded-[10px] text-brand-strong hover:bg-white/60"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
