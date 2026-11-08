import Figure, { type FigureTone } from './Figure'

// ponytail: the old names stay only until their callers move to `Figure` (docs/worklog.md, #120 → Open); then this file goes.
const ACCENT_TONE: Record<string, FigureTone> = {
  'text-text-main': 'main',
  'text-accent': 'accent',
  'text-hardcore': 'hardcore',
  'text-softcore': 'softcore',
  'text-success': 'success',
  'text-info': 'info',
  'text-warning': 'warning',
  'text-danger': 'danger',
  'text-sky-300': 'platinum',
}

type Old = { label: string; value: string | number; accent?: string; loading?: boolean; className?: string }

/** @deprecated `Figure` (`look="bare"`, or `"tile"` for `size="sm"`). */
export function StatPill({
  accent,
  accentColor,
  size = 'lg',
  ...rest
}: Old & { sub?: string; accentColor?: string; size?: 'sm' | 'lg'; href?: string; onClick?: () => void }) {
  return <Figure {...rest} look={size === 'sm' ? 'tile' : 'bare'} tone={accent ? ACCENT_TONE[accent] : undefined} color={accentColor} />
}

/** @deprecated `Figure look="card"`. */
export function StatCard({ accent, ...rest }: Old) {
  return <Figure {...rest} look="card" tone={accent ? ACCENT_TONE[accent] : undefined} />
}
