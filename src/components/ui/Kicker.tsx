import type { ElementType, ReactNode } from 'react'

type Tone = 'muted' | 'accent' | 'danger' | 'warning' | 'inherit'
type Size = 'xs' | 'sm' | 'md'

const SIZES: Record<Size, string> = {
  xs: 'text-[0.8125rem] font-semibold',
  sm: 'text-[0.8125rem] font-bold',
  md: 'text-sm font-bold',
}

const TONES: Record<Tone, string> = {
  muted: 'text-text-secondary',
  accent: 'text-accent',
  danger: 'text-danger',
  warning: 'text-warning',
  // The colour is the caller's: a tier's hue, a label on a picture.
  inherit: '',
}

/** The kicker's classes, for an element that cannot be a `Kicker` (a `<dt>`, a `<th>`). */
export function kickerClass(tone: Tone = 'muted', size: Size = 'xs') {
  return `${SIZES[size]} ${TONES[tone]}`
}

/**
 * The small label over a title or a figure, in sentence case (identity B,
 * #127: "This week", never "THIS WEEK"). `xs` is the home's chart heads and a
 * figure's label, `sm` a panel's or a group's, `md` the welcome's.
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
