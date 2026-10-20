import { useCallback, useMemo } from 'react'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { isConsoleShown } from '@/utils/consoleFilter'
import type { RecentAchievement } from '@/types/types'

/**
 * Whether a game's unlocks still count, given the consoles unticked in
 * preferences: what the feeds, the streak and the charts filter by. A game on
 * a hidden console leaves them as it leaves the lists.
 *
 * RA says the console on each unlock; PlayStation and Xbox only say the
 * platform, so their games are looked up in the library by id. Steam has no
 * consoles. Someone else's page is never filtered (the preference is the
 * viewer's own).
 */
export function useConsoleVisibility() {
  const subject = useSubject()
  const { hidden: raHidden } = useHiddenConsoles('ra')
  const { hidden: psnHidden } = useHiddenConsoles('psn')
  const { hidden: xboxHidden } = useHiddenConsoles('xbox')
  const { fullLibrary: psnLibrary = [] } = usePsnGamesData()
  const { fullLibrary: xboxLibrary = [] } = useXboxGamesData()

  const hiddenPsn = useMemo(() => new Set(psnLibrary.filter((g) => !isConsoleShown(g.consoleName, psnHidden)).map((g) => g.id)), [psnLibrary, psnHidden])
  const hiddenXbox = useMemo(() => new Set(xboxLibrary.filter((g) => !isConsoleShown(g.consoleName, xboxHidden)).map((g) => g.id)), [xboxLibrary, xboxHidden])
  const filtering = !subject && (raHidden.size > 0 || hiddenPsn.size > 0 || hiddenXbox.size > 0)

  /** An unlock in RA's shape (every platform is mapped into it). */
  const isShown = useCallback(
    (a: Pick<RecentAchievement, 'Source' | 'GameID' | 'ConsoleName'>) => {
      if (!filtering) return true
      if (a.Source === 'psn') return !hiddenPsn.has(a.GameID)
      if (a.Source === 'xbox') return !hiddenXbox.has(a.GameID)
      if (a.Source === 'steam') return true
      return isConsoleShown(a.ConsoleName, raHidden)
    },
    [filtering, hiddenPsn, hiddenXbox, raHidden],
  )

  /** A PlayStation or Xbox game by its id, for their own feeds. */
  const isGameShown = useCallback(
    (source: 'psn' | 'xbox', gameId: number) => !filtering || !(source === 'psn' ? hiddenPsn : hiddenXbox).has(gameId),
    [filtering, hiddenPsn, hiddenXbox],
  )

  return { isShown, isGameShown, filtering }
}
