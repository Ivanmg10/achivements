'use client'

import { ReactNode } from 'react'

/** One thing the app does, said plainly: icon, what it is, what you get. */
export default function LandingFeature({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <article className="bg-bg-card rounded-2xl p-6 ring-1 ring-white/5 flex flex-col gap-3 h-full">
      <span aria-hidden="true" className="text-accent">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
    </article>
  )
}
