'use client'

import { useState, type ReactNode } from 'react'

/**
 * Renders its children from the first time `open` is true, and from then on
 * for good: so a modal that is a `next/dynamic` import is downloaded the first
 * time it is wanted instead of with the page, and still stays mounted after
 * closing so that its exit animation plays.
 */
export default function LazyWhenOpened({ open, children }: { open: boolean; children: ReactNode }) {
  const [seen, setSeen] = useState(open)
  // Render-phase state: the React-endorsed way to remember "it has been open".
  if (open && !seen) setSeen(true)
  return seen || open ? <>{children}</> : null
}
