'use client'

import { useEffect, useState } from 'react'

/**
 * Which of the page's sections is being read: the last one, in page order,
 * inside the band under the top bar, as the person scrolls (for a menu that
 * follows them). Starts on the first. The answer is set from the observer's callback.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const seen = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id)
          else seen.delete(e.target.id)
        }
        // The last of those in the band, in page order: the one just being reached, not the one being left.
        const inBand = ids.filter((id) => seen.has(id))
        if (inBand.length > 0) setActive(inBand[inBand.length - 1])
      },
      { rootMargin: '-96px 0px -60% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}
