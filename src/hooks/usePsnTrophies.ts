import { useLanguage } from '@/context/LanguageContext'
import { psnErrorFrom } from '@/hooks/usePsnLink'
import { usePlatformRead } from '@/hooks/usePlatformRead'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

type Trophies = { trophies: PsnTrophy[]; groups: PsnTrophyGroup[] }

const SPEC = {
  tag: 'usePsnTrophies',
  errorFrom: psnErrorFrom,
  parse: (body: unknown): Trophies => {
    const data = body as { trophies?: PsnTrophy[]; groups?: PsnTrophyGroup[] }
    if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN response')
    return { trophies: data.trophies, groups: data.groups ?? [] }
  },
}

/**
 * One PSN game's trophies and trophy groups (base game, each DLC) for the
 * signed-in user, by Sony's ID ("NPWR20188_00"), in the app's language.
 * Null loads nothing.
 */
export function usePsnTrophies(titleId: string | null) {
  const { lang } = useLanguage()
  const subject = useSubject()
  const url = titleId ? withSubject(`/api/psn/trophies?id=${encodeURIComponent(titleId)}&lang=${lang}`, subject) : null
  const { data, error, isLoading, retry } = usePlatformRead(url, SPEC)
  return { trophies: data?.trophies ?? [], groups: data?.groups ?? [], isLoading, error, retry }
}
