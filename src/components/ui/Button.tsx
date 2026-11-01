import Link from 'next/link'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg'

// The shape sits on ::before, skewed by the design's slant; the text stays upright.
// The shape is inset by what the slant adds on each side, so a full-width button
// lines up with the fields above and below it.
const BASE =
  'relative isolate inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none ' +
  "before:content-[''] before:absolute before:inset-y-0 before:inset-x-(--button-inset) before:-z-10 before:rounded-button before:skew-x-(--slant-button) before:transition-colors before:duration-(--motion-hover) " +
  'transition-colors duration-(--motion-hover) disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main focus-visible:rounded-button'

const VARIANTS: Record<Variant, string> = {
  primary: 'text-bg-main before:bg-accent hover:before:bg-accent-hover',
  secondary: 'text-text-main before:ring-1 before:ring-inset before:ring-ink/20 hover:before:bg-ink/[0.06]',
  quiet: 'text-text-secondary hover:text-text-main hover:before:bg-ink/[0.05]',
  danger: 'text-danger before:bg-danger/12 before:ring-1 before:ring-inset before:ring-danger/45 hover:before:bg-danger/20',
}

const SIZES: Record<Size, string> = {
  sm: 'h-(--h-control-sm) px-3.5 text-sm',
  md: 'h-(--h-control) px-5 text-sm',
  lg: 'min-h-12 px-6 text-[0.9375rem]',
}

/** The classes of a library button, for the rare place that cannot render `Button` itself. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

function Spinner() {
  return <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin motion-reduce:animate-none" />
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
 * The site's button: primary (the accent, slanted), secondary (a ring),
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
