import type { LibraryEntry } from '@/utils/libraryInsights'

/** A library entry of any platform, with just what the library views read. */
export function libraryEntry(kind: LibraryEntry['kind'], id: number, title: string, o: { pct?: number | null; lastPlayed?: string | null; game?: object } = {}): LibraryEntry {
  const game =
    kind === 'ra'
      ? { GameID: id, Title: title, ImageIcon: '/Images/1.png', ConsoleName: 'SNES', NumAwarded: 3, MaxPossible: 10, PctWon: '0.3' }
      : kind === 'steam'
        ? { id, title, imageIcon: 'https://img/s.png', hasStats: true, maxPossible: 20, numAwarded: 5, playtimeForever: 60, playtime2Weeks: 0 }
        : { id, title, imageIcon: 'https://img/p.png', titleId: `NPWR${id}_00`, maxPossible: 30, numAwarded: 9 }
  return {
    kind, key: `${kind}:${id}`, title, pct: o.pct === undefined ? 30 : o.pct, lastPlayed: o.lastPlayed ?? null, game: { ...game, ...o.game },
  } as unknown as LibraryEntry
}
