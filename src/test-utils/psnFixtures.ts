import type { PsnGameProgress } from '@/types/psn'

const NONE = { bronze: 0, silver: 0, gold: 0, platinum: 0 }

/**
 * A complete PsnGameProgress for tests, so a fixture only says what its test is
 * about and a field added to the type later does not break twenty literals.
 */
export function psnGameFixture(overrides: Partial<PsnGameProgress> = {}): PsnGameProgress {
  const defined = { ...NONE, bronze: 1 }
  return {
    _source: 'psn',
    id: 100,
    titleId: 'NPWR00001_00',
    service: 'trophy2',
    title: 'Game',
    imageIcon: '',
    consoleName: 'PS5',
    maxPossible: 1,
    numAwarded: 0,
    pctWon: 0,
    lastPlayed: null,
    earned: NONE,
    defined,
    hasDlc: false,
    full: { earned: NONE, defined, pctWon: 0 },
    lastTrophyAt: null,
    playtimeMinutes: null,
    playedAs: [],
    playCount: null,
    coverUrl: null,
    heroUrl: null,
    conceptId: null,
    ...overrides,
  }
}
