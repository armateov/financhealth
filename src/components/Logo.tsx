import { Link } from '@tanstack/react-router'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#16211c" />
      <path d="M8 21.5h16" stroke="#e2dac8" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M9 17.5l4.5-4 3.5 2.5 6-6"
        fill="none"
        stroke="#c9e0d3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="10" r="1.9" fill="#b0833a" />
    </svg>
  )
}

export function Logo({ to = '/' }: { to?: '/' | '/app' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 no-underline">
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        Ledgerwise
      </span>
    </Link>
  )
}
