'use client'

import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import type { XboxGameProgress } from '@/types/xbox'
import MainPageProfileLibraryGame from '../../main-page-profile-library-game/MainPageProfileLibraryGame'

/** The game card in the Xbox profile: the last game played, with its gamerscore. */
export default function MainPageProfileXboxGame({ game }: { game: XboxGameProgress }) {
  return <MainPageProfileLibraryGame source="xbox" game={game} counts={<XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="text-[0.8125rem]" />} />
}
