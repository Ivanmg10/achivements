import { RefObject, useEffect, useMemo, useState } from 'react'
import { previewColumns, previewCounts } from '@/utils/sectionPreview'

// A section's horizontal padding and border, between the page column and its preview grid.
const SECTION_INSET = 34

/**
 * The folded previews of every platform section on a page, sized together:
 * columns from the page's width, rows from the screen's height, shared out
 * by how many games each section has. Re-measured on resize.
 */
export function usePreviewLayout(ref: RefObject<HTMLElement | null>, gameCounts: number[]) {
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox({ width: el.clientWidth - SECTION_INSET, height: window.innerHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  const key = gameCounts.join(',')
  return useMemo(() => {
    const columns = box.width > 0 ? previewColumns(box.width) : 3
    const counts = box.width > 0 ? previewCounts(columns, box.height, gameCounts) : gameCounts.map(() => 3)
    return { columns, counts }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key stands for gameCounts
  }, [box, key])
}
