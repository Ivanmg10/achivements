import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * The row's look, for an element that is not a `ListRow` (a person drawn by
 * `UserSummary`): the accent tint on hover and focus, and the accent's slanted
 * mark on the left of the one with focus.
 */
export const LIST_ROW =
  "relative overflow-hidden w-full flex items-center gap-3 min-h-[3.375rem] px-2.5 py-1.5 rounded-tile text-left cursor-pointer transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-accent before:skew-y-(--slant-mark) before:opacity-0 focus-visible:before:opacity-100"

type Props = {
  /** A picture or an icon, in a 40 px box. */
  media: ReactNode
  title: ReactNode
  /** A quiet line under the title. */
  sub?: ReactNode
  /** Whatever sits on the right: a count, a tag, a chevron. */
  trailing?: ReactNode
  /** Layout only. */
  className?: string
}

/**
 * One row of a list you pick from (search results, a menu of people or
 * games): a picture, a title, a line under it and something on the right. A
 * link with `href`, a button otherwise.
 */
export default function ListRow({
  media,
  title,
  sub,
  trailing,
  className = '',
  href,
  ...button
}: Props & { href?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'className' | 'children'>) {
  const inner = (
    <>
      <span className="w-10 h-10 rounded-box overflow-hidden shrink-0 flex items-center justify-center bg-ink/10">{media}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold truncate">{title}</span>
        {sub && <span className="block text-[0.8125rem] text-text-secondary truncate">{sub}</span>}
      </span>
      {trailing}
    </>
  )
  if (href) return <Link href={href} className={`${LIST_ROW} ${className}`}>{inner}</Link>
  return (
    <button type="button" className={`${LIST_ROW} ${className}`} {...button}>
      {inner}
    </button>
  )
}
