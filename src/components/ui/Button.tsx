import Link from 'next/link'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

// The shape sits on ::before. Only the primary leans on the design's one angle (identity B, #127); the text stays upright.
// Its shape is inset by what the slant adds on each side, so a full-width primary
// lines up with the fields above and below it; the others are upright and fill their box.
const BASE =
  'relative isolate tap-target inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none ' +
  "before:content-[''] before:absolute before:inset-y-0 before:-z-10 before:rounded-button before:transition-colors before:duration-(--motion-hover) " +
  'transition-colors duration-(--motion-hover) disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none ' +
  'focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main focus-visible:rounded-button'

const VARIANTS: Record<Variant, string> = {
  primary: 'text-bg-main before:inset-x-(--button-inset) before:skew-x-(--slant) before:bg-accent hover:before:bg-accent-hover',
  secondary: 'before:inset-x-0 text-text-main before:ring-1 before:ring-inset before:ring-ink/20 hover:before:bg-ink/[0.06]',
  quiet: 'before:inset-x-0 text-text-secondary hover:text-text-main hover:before:bg-ink/[0.05]',
  danger: 'before:inset-x-0 text-danger before:bg-danger/12 before:ring-1 before:ring-inset before:ring-danger/45 hover:before:bg-danger/20',
}

const SIZES: Record<Size, string> = {
  sm: 'h-(--h-control-sm) px-3.5 text-sm',
  md: 'h-(--h-control) px-5 text-sm',
  lg: 'min-h-12 px-6 text-[0.9375rem]',
  // A title screen's two ways in (the landing): as big as the screen lets them be, a phone's two side by side included.
  xl: 'min-h-14 px-5 text-base sm:min-h-16 sm:px-9 sm:text-lg short:min-h-12 short:px-7 short:text-base uhd:min-h-[4.5rem] uhd:px-11 uhd:text-xl',
}

/** The classes of a library button, for the rare place that cannot render `Button` itself. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

type Common = {
  variant?: Variant
  size?: Size
  /** Shows a spinner and blocks the button; its text stays, so its width does not jump. */
  loading?: boolean
  /** Layout only (margin, width, flex); never colours. */
  className?: string
  children: React.ReactNode
}

type AsButton = Common & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined }
type AsLink = Common & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string }

/**
 * The site's button: primary (the accent, the one that leans), secondary (a ring),
 * quiet (text only) and danger. With `href` it renders a link that looks the same.
 */
export default function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', loading = false, className = '', children, ...rest } = props
  const cls = buttonClass(variant, size, className)
  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  )

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as AsLink
    return (
      <Link href={href} className={cls} aria-disabled={loading || undefined} {...anchor}>
        {content}
      </Link>
    )
  }

  const { type = 'button', disabled, ...button } = rest as AsButton
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...button}>
      {content}
    </button>
  )
}
