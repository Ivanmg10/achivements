'use client'

import { useEffect } from 'react'
import { useFontStyle } from '@/hooks/useFontStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'

/**
 * Puts the person's shape (`useShapeStyle`) and font (`useFontStyle`) on
 * <html> as `data-shape` and `data-font`, where the tokens read them, and the
 * home's layout as `data-home-layout`, which its skeleton reads. Draws nothing. The script in the root layout paints the last choices this browser
 * used before the first frame, so there is no flash.
 */
export default function ShapeSync() {
  const [shape] = useShapeStyle()
  const [font] = useFontStyle()
  const [homeLayout] = useHomeLayout()

  useEffect(() => {
    document.documentElement.dataset.shape = shape
    document.documentElement.dataset.font = font
    document.documentElement.dataset.homeLayout = homeLayout
    return () => {
      delete document.documentElement.dataset.shape
      delete document.documentElement.dataset.font
      delete document.documentElement.dataset.homeLayout
    }
  }, [shape, font, homeLayout])

  return null
}
