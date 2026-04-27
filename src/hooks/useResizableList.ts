import { RefObject, useEffect, useState } from 'react'

type Options = {
  sectionRef: RefObject<HTMLElement | null>
  maxItems?: number
  cardHeightPx: number
  headerPx: number
  footerPx: number
}

export function useResizableList({ sectionRef, maxItems, cardHeightPx, headerPx, footerPx }: Options) {
  const [visibleCount, setVisibleCount] = useState(maxItems ?? 5)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new ResizeObserver(() => {
      const height = sectionRef.current?.clientHeight ?? 0
      const available = height - headerPx - footerPx
      const count = Math.max(1, Math.floor(available / cardHeightPx))
      setVisibleCount(maxItems ? Math.min(maxItems, count) : count)
    })
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return visibleCount
}
