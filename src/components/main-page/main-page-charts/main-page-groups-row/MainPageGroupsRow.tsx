'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

/** A group's row: a link to its page, or, when picking, a toggle that says whether it is the one shown. */
export default function MainPageGroupsRow({ href, onSelect, selected, children }: { href: string; onSelect?: () => void; selected: boolean; children: ReactNode }) {
  const className = `w-full text-left flex items-center gap-2.5 rounded-lg p-2 pr-8 transition-colors group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
    selected ? 'bg-bg-tertiary ring-1 ring-white/10' : 'bg-bg-main hover:bg-white/5'
  }`
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} aria-pressed={selected} className={className}>
        {children}
      </button>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
