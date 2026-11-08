import type { ReactNode } from 'react'

export type TagTone = 'neutral' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'hardcore' | 'overlay'

const TONES: Record<TagTone, string> = {
  neutral: 'bg-ink/[0.08] text-text-main',
  muted: 'bg-ink/[0.07] text-text-secondary',
  accent: 'bg-accent/15 text-accent',
  info: 'bg-info/[0.14] text-info',
  success: 'bg-success/[0.14] text-success',
  warning: 'bg-warning/[0.16] text-warning',
  danger: 'bg-danger/[0.14] text-danger',
  hardcore: 'bg-hardcore/[0.14] text-hardcore',
  // On a picture: dark glass, the text keeps the colour of what it sits in.
  overlay: 'bg-black/45',
}

const SIZES = {
  sm: 'h-5 px-2 gap-1 text-[0.6875rem]',
  md: 'h-[1.375rem] px-2 gap-1.5 text-xs',
  lg: 'h-6 px-[0.5625rem] gap-1.5 text-xs',
}

/**
 * A small tinted label (Beta, You, a console, a state). Its tone says what it
 * means, so a word goes with it, never colour alone. `slant` leans it on the
 * design's slant, as the game page's chips do; the text stays upright.
 */
export default function Tag({
  tone = 'muted',
  size = 'md',
  slant = false,
  className = '',
  children,
}: {
  tone?: TagTone
  size?: keyof typeof SIZES
  slant?: boolean
  /** Layout only. */
  className?: string
  children: ReactNode
}) {
  const box = `inline-flex items-center rounded-tag font-sans not-italic font-bold whitespace-nowrap ${SIZES[size]} ${TONES[tone]}`
  if (!slant) return <span className={`${box} ${className}`}>{children}</span>
  return (
    <span className={`${box} skew-x-(--slant-pill) ${className}`}>
      <span className={`inline-flex items-center -skew-x-(--slant-pill) ${size === 'sm' ? 'gap-1' : 'gap-1.5'}`}>{children}</span>
    </span>
  )
}
