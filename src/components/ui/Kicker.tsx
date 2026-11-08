import type { ElementType, ReactNode } from 'react'

type Tone = 'muted' | 'accent' | 'danger'
type Size = 'xs' | 'sm' | 'md'

const SIZES: Record<Size, string> = {
  xs: 'text-[10px] tracking-widest',
  sm: 'text-[0.6875rem] font-bold tracking-[0.12em]',
  md: 'text-xs font-bold tracking-[0.14em]',
}

const TONES: Record<Tone, string> = {
  muted: 'text-text-secondary',
  accent: 'text-accent',
  danger: 'text-danger',
}

/** The kicker's classes, for an element that cannot be a `Kicker` (a `<dt>`, a `<th>`). */
export function kickerClass(tone: Tone = 'muted', size: Size = 'xs') {
  return `uppercase ${SIZES[size]} ${TONES[tone]}`
}

/**
 * The small uppercase, tracked label over a title or a figure. `xs` is the
 * home's chart heads, `sm` a panel's or a group's, `md` the welcome's.
 */
export default function Kicker({
  as: Tag = 'p',
  tone = 'muted',
  size = 'xs',
  id,
  role,
  className = '',
  children,
}: {
  as?: ElementType
  tone?: Tone
  size?: Size
  id?: string
  role?: string
  /** Layout only. */
  className?: string
  children: ReactNode
}) {
  return (
    <Tag id={id} role={role} className={`${kickerClass(tone, size)} ${className}`}>
      {children}
    </Tag>
  )
}
