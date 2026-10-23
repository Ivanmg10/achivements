type Tone = 'default' | 'accent' | 'danger'

const TONES: Record<Tone, string> = {
  default: 'text-text-secondary hover:text-text-main',
  accent: 'text-accent',
  danger: 'text-text-secondary hover:text-danger',
}

const SIZES = { sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-11 h-11' }

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'aria-label'> & {
  /** Required: the button has no visible text. */
  'aria-label': string
  tone?: Tone
  size?: keyof typeof SIZES
  /** Layout only. */
  className?: string
  children: React.ReactNode
}

/**
 * A button that is only an icon: square, quiet until hovered, tinted with the
 * accent when pressed (`aria-pressed`). The icon inside should be `aria-hidden`.
 */
export default function IconButton({ tone = 'default', size = 'md', className = '', type = 'button', children, ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${SIZES[size]} shrink-0 inline-flex items-center justify-center rounded-control transition-colors duration-(--motion-hover) hover:bg-ink/[0.08] aria-pressed:bg-accent/15 aria-pressed:text-accent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
