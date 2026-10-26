import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { User } from '../auth/auth.types'
import { SignOutErrorDialog } from './components/sign-out-error-dialog'

const NAV_LINK_CLASS =
  'inline-flex min-h-11 items-center rounded-[10px] px-3.5 text-sm font-medium text-ink-soft no-underline aria-[current=page]:bg-brand-tint aria-[current=page]:font-semibold aria-[current=page]:text-brand-strong'

interface AppLayoutProps {
  user: User
  isSigningOut: boolean
  signOutFailed: boolean
  onSignOut: () => void
  onDismissSignOutError: () => void
  children: ReactNode
}

export function AppLayout({
  user,
  isSigningOut,
  signOutFailed,
  onSignOut,
  onDismissSignOutError,
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-2 px-6 py-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2.5 text-lg font-bold text-ink no-underline"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-brand text-[15px] text-white"
            >
              L
            </span>
            Lumni
          </Link>
          {/* Quoting and booking are for customers; the admin's links come with its bookings table. */}
          <nav aria-label="Main" className="flex flex-auto flex-wrap gap-1">
            {user.role === 'customer' && (
              <>
                <Link
                  to="/quote"
                  activeOptions={{ exact: true, includeSearch: false }}
                  className={NAV_LINK_CLASS}
                >
                  Quote
                </Link>
                <Link
                  to="/bookings"
                  activeOptions={{ exact: true, includeSearch: false }}
                  className={NAV_LINK_CLASS}
                >
                  My bookings
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2.5 text-sm text-ink-soft">
            <span>{user.email}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-brand-strong capitalize">
              {user.role}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand-strong hover:text-brand-deep disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 pt-10 pb-18">
        {children}
      </main>

      <SignOutErrorDialog
        open={signOutFailed}
        onDismiss={onDismissSignOutError}
      />
    </div>
  )
}
