import { IconQuestionMark } from '@tabler/icons-react'

/**
 * The tile of an achievement or trophy that has no picture to show — a secret
 * one still hidden, or one with no icon — so it reads as "hidden" and not as
 * a broken image. Decorative: the link around it carries the name.
 */
export default function ConcealedBadge({ sizeClass, dim }: { sizeClass: string; dim: boolean }) {
  return (
    <div aria-hidden="true" className={`${sizeClass} bg-ink/10 flex items-center justify-center text-text-secondary ${dim ? 'opacity-40' : ''}`}>
      <IconQuestionMark size={20} />
    </div>
  )
}
