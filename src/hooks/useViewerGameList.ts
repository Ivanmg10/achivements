import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import type { GameSource } from '@/types/steam'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { canUseXbox } from '@/utils/xboxAccess'
import { psnCompareList, raCompareList, steamCompareList, xboxCompareList, type CompareAchievement } from '@/utils/gameCompare'

/**
 * The signed-in viewer's own achievements in one game, to set beside someone
 * else's. Call it outside SubjectProviders, where the session is the viewer's.
 *
 * `id` is the game as its page URL has it (RA id, Steam appid, PSN title id).
 * `linked` says whether the viewer has that platform at all; `error` covers a
 * game they do not own or never played, which the platforms answer as a failure.
 */
export function useViewerGameList(source: GameSource, id: string, enabled: boolean) {
  const { data: session } = useSession()
  const user = session?.user
  const linked =
    source === 'ra'
      ? user?.raLinked === true
      : source === 'steam'
        ? Boolean(user?.steamid)
        : source === 'psn'
          ? Boolean(user?.psnaccountid)
          : Boolean(user?.xboxxuid) && canUseXbox(user?.admin)
  const on = enabled && linked

  const ra = useGameProgression(on && source === 'ra' ? id : null)
  const steam = useSteamAchievements(on && source === 'steam' && /^\d+$/.test(id) ? Number(id) : null)
  const psn = usePsnTrophies(on && source === 'psn' ? id : null)
  const xbox = useXboxAchievements(on && source === 'xbox' ? id : null)

  const list: CompareAchievement[] | null = useMemo(() => {
    if (!on) return null
    if (source === 'ra') return ra.game && String(ra.game.ID) === id ? raCompareList(ra.game) : null
    if (source === 'steam') return steam.error ? null : steamCompareList(steam.achievements)
    if (source === 'psn') return psn.error ? null : psnCompareList(psn.trophies)
    return xbox.error ? null : xboxCompareList(xbox.achievements)
  }, [on, source, id, ra.game, steam.achievements, steam.error, psn.trophies, psn.error, xbox.achievements, xbox.error])

  const state =
    source === 'ra'
      ? { isLoading: ra.isLoading, error: ra.error, retry: ra.refetch }
      : source === 'steam'
        ? { isLoading: steam.isLoading, error: Boolean(steam.error), retry: steam.retry }
        : source === 'psn'
          ? { isLoading: psn.isLoading, error: Boolean(psn.error), retry: psn.retry }
          : { isLoading: xbox.isLoading, error: Boolean(xbox.error), retry: xbox.retry }

  return { list, linked, isLoading: on && state.isLoading, error: on && state.error, retry: state.retry }
}
