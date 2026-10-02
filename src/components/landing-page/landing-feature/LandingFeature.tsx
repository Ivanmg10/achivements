'use client'

import { ReactNode } from 'react'
import { useSpotlight } from '@/hooks/useSpotlight'

/**
 * One thing the app does, said plainly: icon, what it is, what you get.
 * `children` is an optional visual under the text, for the bigger tiles.
 */
export default function LandingFeature({
  icon,
  title,
  text,
  children,
  className = '',
}: {
  icon: ReactNode
  title: string
  text: string
  children?: ReactNode
  className?: string
}) {
  const onPointerMove = useSpotlight()
  return (
    <article
      onPointerMove={onPointerMove}
      className={`spotlight bg-bg-card rounded-3xl p-6 sm:p-7 ring-1 ring-white/[0.06] flex flex-col gap-3 h-full overflow-hidden ${className}`}
    >
      <span aria-hidden="true" className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
        {icon}
      </span>
      <h3 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-[48ch]">{text}</p>
      {children}
    </article>
  )
}
