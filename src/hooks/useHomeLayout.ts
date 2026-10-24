'use client'

import { useStoredChoice } from '@/hooks/useStoredChoice'

export const HOME_LAYOUTS = ['classic', 'cover'] as const
export type HomeLayout = (typeof HOME_LAYOUTS)[number]

/**
 * How the home looks, the person's choice (Preferences → General): `classic`, the
 * default, or `cover`, with the game played last in big on top. Synced with the
 * account (`home-layout` in syncedPreferences).
 */
export function useHomeLayout() {
  return useStoredChoice<HomeLayout>('home-layout', HOME_LAYOUTS, 'classic')
}
