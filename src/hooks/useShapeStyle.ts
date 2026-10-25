'use client'

import { useStoredChoice } from '@/hooks/useStoredChoice'

export const SHAPE_STYLES = ['slanted', 'round'] as const
export type ShapeStyle = (typeof SHAPE_STYLES)[number]
export const SHAPE_STORAGE_KEY = 'shape-style'

/**
 * The shape of the controls, bars and tags, the person's choice (Preferences →
 * General): `slanted`, the default, or `round`. It is `data-shape` on <html>
 * (see `ShapeSync`), which the design's tokens in globals.css answer to.
 * Synced with the account (`shape-style` in syncedPreferences).
 */
export function useShapeStyle() {
  return useStoredChoice<ShapeStyle>(SHAPE_STORAGE_KEY, SHAPE_STYLES, 'slanted')
}
