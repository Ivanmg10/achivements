import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { CountUp } from './CountUp'
import { Skeleton } from './Skeleton'
import { kickerClass } from './Kicker'

export type FigureTone = 'main' | 'accent' | 'hardcore' | 'softcore' | 'success' | 'info' | 'warning' | 'danger' | 'platinum'
export type FigureLook = 'bare' | 'tile' | 'card'

const TONES: Record<FigureTone, string> = {
  main: 'text-text-main',
  accent: 'text-accent',
  hardcore: 'text-hardcore',
  softcore: 'text-softcore',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  platinum: 'text-platinum',
}

// bare: figures side by side with a fine slanted rule between them (the agreed design); tile: a small centred box;
// card: the label on top, the figure big under it (a profile or platform card). `compact` is the platform cards' size.
const LOOKS = {
  bare: {
    box: "relative px-3 py-1 flex flex-col gap-0.5 flex-1 min-w-24 rounded-tile before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-ink/12 before:skew-x-(--slant-button) first:before:hidden",
    label: `${kickerClass()} font-semibold`,
    value: 'text-[1.75rem] leading-tight font-bold tabular-nums',
    skeleton: 'h-[1lh] w-16 max-w-full',
    press: "text-left isolate after:content-[''] after:absolute after:inset-0 after:-z-10 after:rounded-tile after:skew-x-(--slant-pill) after:transition-colors hover:after:bg-ink/5 transition-colors focus-ring",
  },
  tile: {
    box: 'bg-bg-main rounded-tile p-2 flex flex-col items-center gap-0.5',
    label: 'text-xs text-text-secondary',
    value: 'text-sm font-bold',
    skeleton: 'h-[1lh] w-10',
    press: 'text-left hover:bg-ink/5 transition-colors focus-ring',
  },
  card: {
    box: 'bg-bg-main rounded-tile px-3 py-2.5 flex flex-col gap-0.5 min-w-0',
    label: 'text-[0.8125rem] text-text-secondary truncate',
    value: 'text-2xl leading-tight font-extrabold tabular-nums truncate',
    skeleton: 'h-[1lh] w-2/3',
    press: 'text-left hover:bg-ink/5 transition-colors focus-ring',
  },
}
const COMPACT = { box: 'bg-bg-main rounded-tile px-3 py-2.5 flex flex-col min-w-0', label: 'text-xs text-text-secondary truncate', value: 'text-xl font-extrabold tabular-nums truncate' }

export type FigureProps = {
  label: string
  value: string | number
  /** A quiet line under the figure (not on `card`). */
  sub?: string
  look?: FigureLook
  /** The figure's colour, from the theme. */
  tone?: FigureTone
  /** A colour that is not a theme's (a streak tier's hue); wins over `tone`. */
  color?: string
  /** `card` only: the smaller size of the account page's platform cards. */
  compact?: boolean
  /** Inside a `<dl>`: the label is its term, the figure its description. */
  term?: boolean
  /** Its figure is on its way: a block in its line, so the row does not move. */
  loading?: boolean
  href?: string
  onClick?: () => void
  /** Layout only. */
  className?: string
}

/**
 * A labelled number: `bare` (no box, the figures of a profile), `tile` (a
 * small box) or `card` (label first, the figure big). A number counts up on
 * `bare`; every look keeps its room while `loading`.
 */
export default function Figure({ label, value, sub, look = 'bare', tone = 'main', color, compact = false, term = false, loading = false, href, onClick, className = '' }: FigureProps) {
  const { lang } = useLanguage()
  const l = LOOKS[look]
  const text = compact ? COMPACT : l
  const shown = typeof value !== 'number' ? value : look === 'bare' ? <CountUp value={value} locale={lang} /> : value.toLocaleString(lang)
  const Label = term ? 'dt' : 'span'
  const Value = term ? 'dd' : 'span'
  const inner = (
    <>
      <Label className={text.label}>{label}</Label>
      <Value className={`${text.value} ${color ? '' : TONES[tone]}`} style={color ? { color } : undefined}>
        {loading ? <Skeleton className={l.skeleton} /> : shown}
      </Value>
      {look !== 'card' && (sub ? <span className="text-xs text-text-secondary">{sub}</span> : loading && look === 'bare' && <span className="text-xs"><Skeleton className="h-[1lh] w-16" /></span>)}
    </>
  )
  const cls = `${compact ? COMPACT.box : l.box} ${className}`
  if (href) return <Link href={href} className={`${cls} ${l.press}`}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} ${l.press}`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}
