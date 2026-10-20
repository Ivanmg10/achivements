import { scoreGame, type ScoreAchievement } from '@/utils/vaultScore'

/**
 * Illustrative games (not real ones) that show the formula's proportions: one
 * demanding game as each platform would report it, and the two kinds of game
 * that used to inflate scores. The balance tests (vaultScore.test.ts) hold the
 * formula to them, and the "How Vault Points work" page shows them.
 */

const lin = (n: number, a: number, b: number) => Array.from({ length: n }, (_, i) => a + (b - a) * (n === 1 ? 0 : i / (n - 1)))
const finished = (list: { w: number; r: number }[]): ScoreAchievement[] => list.map(({ w, r }) => ({ native: w, rarity: r, earned: true, earnedAt: '2026-10-01T10:00:00Z' }))

const psn = [{ w: 90, r: 8 }, ...lin(6, 30, 8).map((r) => ({ w: 90, r })), ...lin(12, 60, 20).map((r) => ({ w: 30, r })), ...lin(30, 95, 25).map((r) => ({ w: 15, r }))]

export const EXAMPLE_GAMES = {
  /** The same demanding game: PSN grades, Steam counting owners (rarer-looking), Xbox gamerscore, a retro game on RA. */
  psn,
  steam: psn.map((a) => ({ w: 1, r: a.r * 0.62 })),
  xbox: [...lin(7, 30, 8).map((r) => ({ w: 90, r })), ...lin(12, 60, 20).map((r) => ({ w: 20, r })), ...lin(30, 95, 25).map((r) => ({ w: 6, r }))],
  ra: [...lin(6, 12, 2).map((r) => ({ w: 25, r })), ...lin(14, 30, 6).map((r) => ({ w: 10, r })), ...lin(20, 55, 15).map((r) => ({ w: 5, r }))],
  /** A one-hour platinum: everyone who starts it finishes it. */
  quick: [{ w: 90, r: 45 }, { w: 90, r: 50 }, ...lin(10, 70, 55).map((r) => ({ w: 15, r }))],
  /** Thousands of achievements, all alike. */
  spam: lin(5000, 2.3, 1.9).map((r) => ({ w: 1, r })),
}

export type ExampleKey = keyof typeof EXAMPLE_GAMES

/** Each example, finished, in Vault Points. */
export function exampleScores(): Record<ExampleKey, number> {
  return Object.fromEntries(Object.entries(EXAMPLE_GAMES).map(([k, list]) => [k, scoreGame(finished(list)).points])) as Record<ExampleKey, number>
}
