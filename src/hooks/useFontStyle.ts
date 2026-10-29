'use client'

import { useStoredChoice } from '@/hooks/useStoredChoice'

export const FONT_STYLES = ['barlow', 'sofia', 'fira'] as const
export type FontStyle = (typeof FONT_STYLES)[number]
export const FONT_STORAGE_KEY = 'font-style'

/**
 * The type family, the person's choice (Preferences → Layout): Barlow, the
 * default, Sofia Sans or Fira Sans, each with its condensed italic display
 * face. It is `data-font` on <html> (see `ShapeSync`), where globals.css swaps
 * the two font variables. Synced with the account (`font-style` in
 * syncedPreferences).
 */
export function useFontStyle() {
  return useStoredChoice<FontStyle>(FONT_STORAGE_KEY, FONT_STYLES, 'barlow')
}
