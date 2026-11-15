import { IconChevronDown } from '@tabler/icons-react'
import { buttonClass } from './Button'

/**
 * Under a capped list: "show the other N" and, once open, "show fewer". A
 * secondary button whose chevron turns over; it reports its state
 * (`aria-expanded`) so the words are not the only thing that says it.
 */
export default function ShowMore({
  expanded,
  onToggle,
  more,
  less,
  size = 'md',
  className = '',
}: {
  expanded: boolean
  onToggle: () => void
  /** The words while folded ("Show the other 31"). */
  more: string
  /** The words while open ("Show fewer"). */
  less: string
  size?: 'sm' | 'md'
  /** Layout only. */
  className?: string
}) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={expanded} className={buttonClass('secondary', size, className)}>
      {expanded ? less : more}
      <IconChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform duration-(--motion-open) ${expanded ? 'rotate-180' : ''}`} />
    </button>
  )
}
