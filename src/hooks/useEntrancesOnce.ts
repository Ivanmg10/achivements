import { useEffect } from 'react'

const LISTS = '.enter-rows, .enter-cards'
/** How many rows of a list play their entrance (globals.css). */
const PLAYED = 12

/** The list `row` belongs to has finished its entrance: none of its rows is still playing one. */
function finishList(row: Element) {
  const list = row.parentElement
  if (!list?.matches(LISTS) || list.hasAttribute('data-entered')) return
  const playing = [...list.children].slice(0, PLAYED).some((r) => r.getAnimations().some((a) => a instanceof CSSAnimation))
  if (!playing) list.setAttribute('data-entered', '')
}

/**
 * A list's entrance plays once (`.enter-rows`, `.enter-cards`): this marks it
 * `data-entered` as its rows finish, so a new order or a filter, which moves nodes
 * and would restart their animations, does not replay it. An attribute React does
 * not own: it stays through a re-render, and a list that is mounted again starts
 * over. Only ever switches an entrance off: nothing waits for it to show.
 */
export function useEntrancesOnce() {
  useEffect(() => {
    const onEnd = (e: AnimationEvent) => finishList(e.target as Element)
    document.addEventListener('animationend', onEnd)
    return () => document.removeEventListener('animationend', onEnd)
  }, [])
}
