import { steamAssetUrl } from '@/lib/steamAssets'

/** Real games, so the tint and the cover show what they will on the person's own. */
export const SAMPLE_GAMES = [
  { title: "Marvel's Spider-Man Remastered", appId: 1817070, earned: 25, total: 51 },
  { title: 'INAZUMA ELEVEN: Victory Road', appId: 2799860, earned: 52, total: 52 },
  { title: 'Hades', appId: 1145360, earned: 38, total: 49 },
  { title: 'ELDEN RING', appId: 1245620, earned: 17, total: 42 },
]

export type SampleGame = (typeof SAMPLE_GAMES)[number]

/** The first game's card and the cover's hero are one block: it grows from one into the other. */
export const SAMPLE_LEAD_ID = 'layout-sample-lead'

export const sampleCover = (game: SampleGame) => steamAssetUrl(game.appId, 'cover')
export const sampleHero = (game: SampleGame) => steamAssetUrl(game.appId, 'hero')

export function samplePct(game: SampleGame) {
  return Math.round((game.earned / game.total) * 100)
}
