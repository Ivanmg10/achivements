import { IconAlertTriangle } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { buttonClass } from '@/components/ui/Button'

const NAMED = 3

/**
 * The achievements a game can still lose, said in one line above its table:
 * how many, the first few by name, and a button that keeps only those in the
 * table (and gives the rest back).
 */
export default function MissableNotice({
  names,
  only,
  onToggleOnly,
}: {
  /** The unearned missable achievements, in game order. */
  names: string[]
  /** Whether the table shows only them. */
  only: boolean
  onToggleOnly: () => void
}) {
  const { T, lang } = useLanguage()
  if (names.length === 0) return null

  const named = names.slice(0, NAMED).map((n) => `«${n}»`)
  const more = names.length - NAMED
  const list = more > 0 ? `${named.join(', ')} ${T.gameInfoTable.missableMore.replace('{n}', String(more))}` : named.join(', ')

  return (
    <div role="status" className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 px-3.5 py-3 rounded-xl bg-danger/10 ring-1 ring-inset ring-danger/30 text-sm">
      <IconAlertTriangle className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <strong className="font-bold">{plural(names.length, T.plurals.missableCount, lang)}</strong> {T.gameInfoTable.missableText} {list}.
      </span>
      <button type="button" onClick={onToggleOnly} aria-pressed={only} className={buttonClass('secondary', 'sm', 'shrink-0')}>
        {only ? T.gameInfoTable.showAllAgain : T.gameInfoTable.showOnlyThese}
      </button>
    </div>
  )
}
