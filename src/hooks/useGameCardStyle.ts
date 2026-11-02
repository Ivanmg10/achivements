'use client'

import { useStoredChoice } from '@/hooks/useStoredChoice'

export const GAME_CARD_STYLES = ['tinted', 'flat'] as const
export type GameCardStyle = (typeof GAME_CARD_STYLES)[number]

/**
 * How a game's card is drawn, the person's choice (Preferences → General):
 * `tinted`, the default, takes the colour of the game's art; `flat` is a plain
 * card, like the recent achievements. Synced with the account
 * (`game-card-style` in syncedPreferences).
 */
export function useGameCardStyle() {
  return useStoredChoice<GameCardStyle>('game-card-style', GAME_CARD_STYLES, 'tinted')
}
