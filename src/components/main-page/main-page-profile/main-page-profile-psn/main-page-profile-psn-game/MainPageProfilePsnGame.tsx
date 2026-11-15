'use client'

import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import type { PsnGameProgress } from '@/types/psn'
import MainPageProfileLibraryGame from '../../main-page-profile-library-game/MainPageProfileLibraryGame'

/** The game card in the PSN profile: the last game played, with its trophies by grade. */
export default function MainPageProfilePsnGame({ game }: { game: PsnGameProgress }) {
  return <MainPageProfileLibraryGame source="psn" game={game} counts={<PsnTrophyCounts earned={game.earned} of={game.defined} className="text-[0.8125rem]" />} />
}
