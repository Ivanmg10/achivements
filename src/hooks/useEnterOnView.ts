'use client'

import { useCallback, useState } from 'react'

type Stage = 'shown' | 'waiting' | 'entering'

/**
 * A block that plays one of the library's entrances (`.enter-rise` by default) when it is scrolled to, the
 * first time. It is never hidden before the script runs: the server's HTML shows it, and only once this has
 * seen it wholly below the screen does it wait out of sight (`.enter-wait`); one already on screen or passed
 * stays as it is. Reduced motion makes the entrance the library's short fade; a page with
 * `data-motion="still"` (the landing's stop button) shows it at once. `ref` goes on the block, `className` on it too.
 */
export function useEnterOnView<T extends HTMLElement = HTMLDivElement>(entrance = 'enter-rise') {
  const [stage, setStage] = useState<Stage>('shown')

  const ref = useCallback((el: T | null) => {
    if (!el || typeof IntersectionObserver === 'undefined') return
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStage((s) => (s === 'waiting' ? 'entering' : s))
          watch.disconnect()
        } else if (entry.boundingClientRect.top >= window.innerHeight) {
          setStage((s) => (s === 'shown' ? 'waiting' : s))
        } else {
          // Above the screen, or at its very bottom already: seen, so it stays.
          watch.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  const className = stage === 'waiting' ? 'enter-on-view enter-wait' : stage === 'entering' ? `enter-on-view ${entrance}` : ''
  return { ref, className }
}
