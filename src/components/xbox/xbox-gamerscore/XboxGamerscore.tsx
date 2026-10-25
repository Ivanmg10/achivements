'use client'

import { useLanguage } from '@/context/LanguageContext'

/**
 * Gamerscore as Xbox writes it: "200/1345 G". With `total`, earned of total; the
 * G carries the word as its title and an accessible name, so it is never just a
 * letter.
 */
export default function XboxGamerscore({
  earned,
  total,
  className = '',
}: {
  earned: number
  total?: number
  className?: string
}) {
  const { T, lang } = useLanguage()
  const n = (value: number) => value.toLocaleString(lang)

  return (
    <span className={`inline-flex items-baseline gap-1 text-xs tabular-nums ${className}`}>
      <span className="text-text-main font-semibold">{n(earned)}</span>
      {total !== undefined && <span className="text-text-secondary">/{n(total)}</span>}
      <abbr title={T.xbox.gamerscore} className="text-success font-semibold no-underline">
        <span aria-hidden="true">G</span>
        <span className="sr-only">{T.xbox.gamerscore}</span>
      </abbr>
    </span>
  )
}
