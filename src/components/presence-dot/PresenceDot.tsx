'use client'

import { useLanguage } from '@/context/LanguageContext'

const SIZE = {
  xs: 'w-2 h-2 ring-2',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3.5 h-3.5 ring-[3px]',
  lg: 'w-5 h-5 ring-4',
}

/**
 * The green dot on someone's picture while they are online. Put it in a
 * `relative` wrapper around the picture. Hidden from screen readers when the
 * text beside it already says so; `announce` when nothing else does.
 */
export default function PresenceDot({
  online,
  size = 'md',
  announce = false,
  ring = 'ring-bg-card',
}: {
  online?: boolean
  size?: keyof typeof SIZE
  /** Nothing beside the picture says they are online: the dot says it. */
  announce?: boolean
  /** The surface the picture sits on, so the dot is cut out of it. */
  ring?: string
}) {
  const { T } = useLanguage()
  if (!online) return null
  return (
    <span
      {...(announce ? { role: 'img', 'aria-label': T.following.online } : { 'aria-hidden': true })}
      className={`absolute right-0 bottom-0 rounded-full bg-success ${ring} ${SIZE[size]}`}
    />
  )
}
