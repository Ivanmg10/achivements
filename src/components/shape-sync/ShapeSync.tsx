'use client'

import { useEffect } from 'react'
import { useShapeStyle } from '@/hooks/useShapeStyle'

/**
 * Puts the person's shape (`useShapeStyle`) on <html> as `data-shape`, where the
 * design's tokens read it. Draws nothing. The script in the root layout paints
 * the last one this browser used before the first frame, so there is no flash.
 */
export default function ShapeSync() {
  const [shape] = useShapeStyle()
  useEffect(() => {
    document.documentElement.dataset.shape = shape
    return () => {
      delete document.documentElement.dataset.shape
    }
  }, [shape])
  return null
}
