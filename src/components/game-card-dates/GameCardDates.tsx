'use client'

import { useLanguage } from '@/context/LanguageContext'
import { validCompletionDate } from '@/utils/completionDates'
import { formatDate } from '@/utils/dates'
import GameCardLine from '@/components/game-card-line/GameCardLine'

/**
 * The date line of a status card: "Finished · date" in the Completed list when the platform has a
 * completion date (never the last session: `docs/library.md`), else "Last played · date". With neither,
 * `never` says so (Steam) or the line is left out.
 */
export default function GameCardDates({
  finishedAt,
  lastPlayed,
  never,
}: {
  /** The completion date, only in the Completed list. */
  finishedAt?: string | null
  lastPlayed?: string | null
  /** What to write after "Last played" when there is no date. */
  never?: string
}) {
  const { T, lang } = useLanguage()
  const finished = validCompletionDate(finishedAt)
  if (finished) return <GameCardLine>{T.libraryDetail.finished} · {formatDate(finished, lang, {})}</GameCardLine>
  if (lastPlayed) return <GameCardLine>{T.steam.lastPlayed} · {formatDate(lastPlayed, lang, {})}</GameCardLine>
  return never ? <GameCardLine>{T.steam.lastPlayed} · {never}</GameCardLine> : null
}
