export const SAMPLE_ART =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Crect width="32" height="32" fill="%237c3aed"/%3E%3Cpath d="M0 22 L10 10 L18 20 L25 12 L32 19 L32 32 L0 32 Z" fill="%2322c55e"/%3E%3C/svg%3E'

export const SAMPLE_GAMES = [
  { title: 'Astral Atlas', earned: 42, total: 60 },
  { title: 'Nebula Drift', earned: 18, total: 40 },
] as const

export type SampleGame = (typeof SAMPLE_GAMES)[number]

export function samplePct(game: SampleGame) {
  return Math.round((game.earned / game.total) * 100)
}
