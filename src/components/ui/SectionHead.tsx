import type { ElementType, ReactNode } from 'react'

const SIZES = {
  md: { title: 'text-base', hint: 'text-xs' },
  lg: { title: 'text-[1.0625rem]', hint: 'text-[0.8125rem]' },
}

/**
 * A section's head: its title, a quiet hint beside it, and whatever sits at
 * the end of the line (an action, a count, a line of what it shows).
 */
export default function SectionHead({
  title,
  id,
  as: Tag = 'h2',
  hint,
  aside,
  size = 'md',
  className = '',
}: {
  title: ReactNode
  /** The heading's id, for the section's `aria-labelledby`. */
  id?: string
  as?: ElementType
  hint?: ReactNode
  aside?: ReactNode
  size?: keyof typeof SIZES
  /** Layout only (margin, an entrance class). */
  className?: string
}) {
  const s = SIZES[size]
  return (
    <div className={`flex items-baseline gap-x-3 gap-y-0.5 flex-wrap ${className}`}>
      <Tag id={id} className={`${s.title} font-bold text-text-main`}>{title}</Tag>
      {hint && <p className={`${s.hint} text-text-secondary`}>{hint}</p>}
      {aside && <div className={`ml-auto ${s.hint} text-text-secondary`}>{aside}</div>}
    </div>
  )
}
