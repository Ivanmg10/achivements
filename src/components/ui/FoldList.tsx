'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import ShowMore from './ShowMore'

/** How long the list takes to grow or shrink, and how long its new rows may take to come in (11 staggered). */
const GROW_MS = 450
const ENTER_MS = 900

/**
 * Marks an item past the cap (`i` its place in the list, `cap` the rows shown folded): while the list unfolds it
 * comes in with the rows' entrance, one after another. Spread it on the row (`<tr {...foldItem(i, 8)}>`).
 */
export type FoldItemProps = { 'data-fold-new'?: ''; style?: CSSProperties }

export function foldItem(i: number, cap: number): FoldItemProps {
  if (i < cap) return {}
  return { 'data-fold-new': '', style: { '--i': Math.min(i - cap, 11) } as CSSProperties }
}

function still() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Moves the box's height from `from` to `to` with a CSS transition, then hands it back to its content. */
function slide(el: HTMLElement, from: number, to: number, done?: () => void) {
  el.style.height = `${from}px`
  el.style.overflow = 'hidden'
  void el.offsetHeight
  el.style.transition = `height ${GROW_MS}ms var(--enter-ease)`
  el.style.height = `${to}px`
  const end = () => {
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''
    done?.()
  }
  const timer = window.setTimeout(end, GROW_MS + 50)
  return () => window.clearTimeout(timer)
}

/**
 * A capped list and its "show the other N" (`ShowMore`), as one piece. Folded, the last row fades out towards the
 * button, so the reader sees there is more. Unfolding grows the box and brings the new rows in with the rows'
 * entrance (they carry `foldItem`); folding shrinks it back, then drops them, and gives the button its focus.
 * CSS motion only, none with reduced motion. The caller keeps the state and renders only the first rows while
 * folded, so the hidden ones are out of the page (and out of the tab order).
 */
export default function FoldList({
  folded,
  onToggle,
  hasMore,
  more,
  less,
  size = 'md',
  buttonClassName = 'self-center',
  className = '',
  children,
}: {
  folded: boolean
  onToggle: () => void
  /** Whether the list is longer than its cap: no button, no fade otherwise. */
  hasMore: boolean
  /** The words while folded ("Show the other 31"). */
  more: string
  /** The words while open ("Show fewer"). */
  less: string
  size?: 'sm' | 'md'
  /** Layout only, for the button. */
  buttonClassName?: string
  /** Layout only, for the box around the list. */
  className?: string
  children: ReactNode
}) {
  const [unfolding, setUnfolding] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const foldedHeight = useRef<number | null>(null)
  const growFrom = useRef<number | null>(null)
  const stop = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    const from = growFrom.current
    if (folded || !el || from === null) return
    growFrom.current = null
    stop.current = slide(el, from, el.scrollHeight)
  }, [folded])

  useEffect(() => {
    if (!unfolding) return
    const timer = window.setTimeout(() => setUnfolding(false), ENTER_MS)
    return () => window.clearTimeout(timer)
  }, [unfolding])

  useEffect(() => () => stop.current?.(), [])

  const toggle = () => {
    const el = box.current
    stop.current?.()
    if (folded) {
      foldedHeight.current = el?.offsetHeight ?? null
      if (el && !still()) {
        growFrom.current = el.offsetHeight
        setUnfolding(true)
      }
      onToggle()
      return
    }
    const fold = () => {
      onToggle()
      button.current?.focus()
    }
    if (!el || still() || foldedHeight.current === null) return fold()
    stop.current = slide(el, el.offsetHeight, foldedHeight.current, fold)
  }

  return (
    <>
      <div ref={box} data-unfolding={unfolding || undefined} className={`${hasMore && folded ? 'fold-fade' : ''} ${className}`}>
        {children}
      </div>
      {hasMore && <ShowMore ref={button} expanded={!folded} onToggle={toggle} more={more} less={less} size={size} className={buttonClassName} />}
    </>
  )
}
