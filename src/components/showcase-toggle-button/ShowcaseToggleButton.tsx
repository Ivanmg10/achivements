'use client'

import { IconTrophy, IconTrophyFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useSubject } from '@/context/SubjectContext'
import { showcaseKey, type ShowcaseEntry } from '@/utils/showcase'

/**
 * Puts an achievement in the user's showcase, or takes it out. Only for an
 * earned one (`entry` is null otherwise), on the user's own pages: on someone
 * else's, or signed out, there is nothing to show.
 */
export default function ShowcaseToggleButton({ entry, size = 18 }: { entry: ShowcaseEntry | null; size?: number }) {
  const { T } = useLanguage()
  const showcase = useOwnShowcase()
  const subject = useSubject()
  if (!entry || !showcase || subject) return null

  const item = showcase.items.find((i) => showcaseKey(i) === showcaseKey(entry))
  const Icon = item ? IconTrophyFilled : IconTrophy

  return (
    <button
      type="button"
      onClick={() => (item ? showcase.remove(item) : showcase.add(entry))}
      aria-pressed={Boolean(item)}
      aria-label={item ? T.showcase.remove : T.showcase.add}
      title={item ? T.showcase.remove : T.showcase.add}
      className={`shrink-0 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        item ? 'text-accent hover:text-accent/80' : 'text-text-secondary hover:text-accent'
      }`}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  )
}
