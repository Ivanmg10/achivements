import { useLanguage } from '@/context/LanguageContext'
import { formatDate, unlockIso } from '@/utils/dates'

/**
 * A date in the site's one format ("22 oct", "Oct 22"; the year only when it is not this one, "22 oct 2025"),
 * in the reader's language, as a `<time>` a machine can read. Nothing when there is no date to tell.
 */
export default function DateText({ value, className }: { value: string | null | undefined; className?: string }) {
  const { lang } = useLanguage()
  const iso = unlockIso(value)
  if (!iso) return null
  return (
    <time dateTime={iso} className={className}>
      {formatDate(value, lang)}
    </time>
  )
}
