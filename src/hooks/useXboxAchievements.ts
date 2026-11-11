import { useLanguage } from '@/context/LanguageContext'
import { xboxErrorFrom } from '@/hooks/useXboxLink'
import { usePlatformRead } from '@/hooks/usePlatformRead'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import type { XboxAchievement } from '@/types/xbox'

const SPEC = {
  tag: 'useXboxAchievements',
  errorFrom: xboxErrorFrom,
  parse: (body: unknown): XboxAchievement[] => {
    const { achievements } = body as { achievements?: XboxAchievement[] }
    if (!Array.isArray(achievements)) throw new Error('Unexpected Xbox response')
    return achievements
  },
}

/**
 * One Xbox game's achievements for the signed-in user, by Xbox's title id
 * ("1738914043"), in the app's language. Null loads nothing.
 */
export function useXboxAchievements(titleId: string | null) {
  const { lang } = useLanguage()
  const subject = useSubject()
  const url = titleId ? withSubject(`/api/xbox/achievements?id=${encodeURIComponent(titleId)}&lang=${lang}`, subject) : null
  const { data, error, isLoading, retry } = usePlatformRead(url, SPEC)
  return { achievements: data ?? [], isLoading, error, retry }
}
