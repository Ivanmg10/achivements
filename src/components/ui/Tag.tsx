import type { CSSProperties, ReactNode } from 'react'

export type TagTone =
  | 'neutral'
  | 'muted'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'hardcore'
  | 'gold'
  | 'surface'
  | 'overlay'
  | 'steam'
  | 'psn'
  | 'xbox'
  | 'white'
  | 'black'
  | 'sky'
  | 'custom'

const TONES: Record<TagTone, string> = {
  neutral: 'bg-ink/[0.08] text-text-main',
  muted: 'bg-ink/[0.07] text-text-secondary',
  accent: 'bg-accent/15 text-accent',
  info: 'bg-info/[0.14] text-info',
  success: 'bg-success/[0.14] text-success',
  warning: 'bg-warning/[0.16] text-warning',
  danger: 'bg-danger/[0.14] text-danger',
  hardcore: 'bg-hardcore/[0.14] text-hardcore',
  // RetroAchievements' gold: a rare unlock.
  gold: 'bg-ra-gold/20 text-ra-gold',
  // The page's own ground, not a tint: a label on a card.
  surface: 'bg-bg-main text-text-main',
  // On a picture: dark glass.
  overlay: 'bg-black/40 text-text-main',
  // The platforms' own marks, the same in every theme. PlayStation and Xbox name a console by the colour of its
  // case too: PS5 and Xbox Series white, PS3 and Xbox 360 black, Vita and a PC light blue.
  steam: 'bg-steam-dark text-steam',
  psn: 'bg-psn-dark text-white',
  xbox: 'bg-xbox text-white',
  white: 'bg-zinc-100 text-zinc-900',
  black: 'bg-black text-zinc-100 ring-1 ring-zinc-500',
  sky: 'bg-platinum text-sky-950',
  // The colours come from `style` (a tier's hue, mixed with the theme's text).
  custom: '',
}

const SIZES = {
  xs: 'px-1.5 py-0.5 gap-1 text-[10px] font-medium rounded-tag-sm',
  sm: 'h-5 px-2 gap-1 text-[0.6875rem] font-bold rounded-tag',
  md: 'h-[1.375rem] px-2 gap-1.5 text-xs font-bold rounded-tag',
  lg: 'h-6 px-[0.5625rem] gap-1.5 text-xs font-bold rounded-tag',
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
  title,
  style,
  className = '',
  children,
}: {
  tone?: TagTone
  /** `xs` (a row's console), `sm` (a table, a card), `md` (22 px, the default), `lg` (24 px, a game page). */
  size?: keyof typeof SIZES
  slant?: boolean
  title?: string
  /** With `tone="custom"`: the background and the text colour. */
  style?: CSSProperties
  /** Layout only. */
  className?: string
  children: ReactNode
}) {
  const box = `inline-flex items-center font-sans not-italic whitespace-nowrap ${SIZES[size]} ${TONES[tone]}`
  if (!slant) return <span title={title} style={style} className={`${box} ${className}`}>{children}</span>
  return (
    <span title={title} style={style} className={`${box} skew-x-(--slant-pill) ${className}`}>
      <span className={`inline-flex items-center -skew-x-(--slant-pill) ${size === 'md' || size === 'lg' ? 'gap-1.5' : 'gap-1'}`}>{children}</span>
    </span>
  )
}
