'use client'

import { useEffect } from 'react'
import { useFontStyle } from '@/hooks/useFontStyle'
import { useShapeStyle } from '@/hooks/useShapeStyle'

/**
 * Puts the person's shape (`useShapeStyle`) and font (`useFontStyle`) on
 * <html> as `data-shape` and `data-font`, where the tokens read them. Draws
 * nothing. The script in the root layout paints the last choices this browser
 * used before the first frame, so there is no flash.
 */
export default function ShapeSync() {
  const [shape] = useShapeStyle()
  const [font] = useFontStyle()

  useEffect(() => {
    document.documentElement.dataset.shape = shape
    document.documentElement.dataset.font = font
    return () => {
      delete document.documentElement.dataset.shape
      delete document.documentElement.dataset.font
    }
  }, [shape, font])

  return null
}
