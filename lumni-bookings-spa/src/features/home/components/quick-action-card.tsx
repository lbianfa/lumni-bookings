import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface QuickActionCardProps {
  to: LinkProps['to']
  title: string
  description: string
  /** A 28px line icon, drawn with `currentColor`. */
  icon: ReactNode
  /** The main action: filled with the brand color. */
  primary?: boolean
}

export function QuickActionCard({
  to,
  title,
  description,
  icon,
  primary = false,
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-3.5 rounded-2xl p-7 no-underline ${
        primary
          ? 'bg-brand text-white hover:bg-brand-strong'
          : 'border border-line bg-white text-ink hover:border-brand'
      }`}
    >
      <span
        className={primary ? 'text-white' : 'text-brand'}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-xl font-bold">{title}</span>
      <span
        className={`text-[15px] leading-normal ${primary ? 'text-white/85' : 'text-muted'}`}
      >
        {description}
      </span>
    </Link>
  )
}
