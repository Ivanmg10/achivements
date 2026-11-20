import { useLanguage } from '@/context/LanguageContext'
import type { DetailOptions } from '@/types/achievementTable'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import type { SteamAchievementUnified } from '@/types/steam'
import type { XboxAchievement } from '@/types/xbox'
import { BASE_GROUP, dlcShortName, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'

/**
 * What each platform's achievement window adds (its tags, the name guides are searched by), one set per
 * platform for both ways in: a row of the game page's table and a badge of the grid (#164).
 */

/** Steam: guides searched by the English name. */
export function useSteamDetailOptions(): DetailOptions<SteamAchievementUnified> {
  return { guideTitle: (a) => a.titleEn ?? a.title }
}

/** Xbox: the gamerscore. */
export function useXboxDetailOptions(): DetailOptions<XboxAchievement> {
  return { tags: (a) => <span className="font-semibold text-success">{a.gamerscore} G</span> }
}

/** PSN: the grade, and the DLC a trophy belongs to when the game has some. */
export function usePsnDetailOptions(groups: PsnTrophyGroup[], gameTitle: string): DetailOptions<PsnTrophy> {
  const { T } = useLanguage()
  return {
    tags: (t) => {
      const dlc = groups.length > 1 ? groups.find((g) => g.id === t.groupId && g.id !== BASE_GROUP) : undefined
      return (
        <>
          <span className={`font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{T.psn[t.type]}</span>
          {dlc && <span className="px-2 py-0.5 rounded-full bg-ink/10 text-text-secondary">DLC · {dlcShortName(dlc.name, gameTitle)}</span>}
        </>
      )
    },
  }
}
