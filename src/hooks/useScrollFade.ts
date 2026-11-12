import { useCallback, useState } from 'react'
import { scrollFadeClass, type ScrollEdges } from '@/components/ui/scrollFade'

/**
 * A strip that scrolls sideways says there is more of it: `ref` goes on the scrolling element,
 * `fade` in its className (`scrollFadeClass`), and the edge with more past it fades out. Kept as
 * it scrolls, as it or its content resizes and as its children change. `fromEnd` opens it scrolled
 * to its end (a year that ends today), so the fade is on its start. Nothing fades while it fits.
 */
export function useScrollFade<T extends HTMLElement = HTMLDivElement>({ fromEnd = false }: { fromEnd?: boolean } = {}) {
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false })

  const ref = useCallback(
    (el: T | null) => {
      if (!el) return
      if (fromEnd) el.scrollLeft = el.scrollWidth
      const measure = () => {
        const start = el.scrollLeft > 1
        const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
        setEdges((e) => (e.start === start && e.end === end ? e : { start, end }))
      }
      const size = new ResizeObserver(measure)
      // The strip and each child: a child that grows (a font, a count) widens what scrolls without resizing the strip.
      const watch = () => {
        size.disconnect()
        size.observe(el)
        for (const child of Array.from(el.children)) size.observe(child)
        measure()
      }
      const content = new MutationObserver(watch)
      content.observe(el, { childList: true })
      el.addEventListener('scroll', measure, { passive: true })
      watch()
      return () => {
        size.disconnect()
        content.disconnect()
        el.removeEventListener('scroll', measure)
      }
    },
    [fromEnd],
  )

  return { ref, fade: scrollFadeClass(edges) }
}
