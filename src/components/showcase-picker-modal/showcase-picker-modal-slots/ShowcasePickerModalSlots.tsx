'use client'

import Image from 'next/image'
import { IconPlus, IconTrophy, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { SHOWCASE_MAX, showcaseKey, type ShowcaseEntry } from '@/utils/showcase'
import DropSlot from '@/components/ui/DropSlot'

const SLOT = 'size-12'

function Badge({ entry }: { entry: Pick<ShowcaseEntry, 'badge'> }) {
  return entry.badge ? (
    <Image src={entry.badge} alt="" width={48} height={48} unoptimized className="size-full rounded-tile object-cover" />
  ) : (
    <span aria-hidden="true" className="size-full rounded-tile bg-ink/10 flex items-center justify-center text-text-secondary">
      <IconTrophy size={20} />
    </span>
  )
}

/**
 * The showcase's places, drawn: what it already holds shows as taken, each achievement picked fills the next
 * place and can be taken out, and the places left are empty (the way back to the games, to pick more).
 */
export default function ShowcasePickerModalSlots({
  taken,
  picked,
  onRemove,
  onBrowse,
}: {
  /** What the showcase holds already. */
  taken: ShowcaseEntry[]
  picked: ShowcaseEntry[]
  onRemove: (entry: ShowcaseEntry) => void
  /** An empty place was clicked: back to the games. */
  onBrowse: () => void
}) {
  const { T } = useLanguage()
  const empty = Math.max(0, SHOWCASE_MAX - taken.length - picked.length)

  return (
    <ul aria-label={T.showcase.slotsLabel} className="flex items-center gap-2 mr-auto">
      {taken.slice(0, SHOWCASE_MAX).map((entry) => (
        <li key={showcaseKey(entry)} className={`${SLOT} relative opacity-60`}>
          <span role="img" aria-label={`${entry.title} · ${T.showcase.inShowcase}`} title={`${entry.title} · ${T.showcase.inShowcase}`} className="block size-full ring-1 ring-ink/15 rounded-tile">
            <Badge entry={entry} />
          </span>
        </li>
      ))}
      {picked.map((entry) => (
        <li key={showcaseKey(entry)} className={`${SLOT} relative`}>
          <button
            type="button"
            onClick={() => onRemove(entry)}
            aria-label={T.showcase.removePick.replace('{title}', entry.title)}
            title={entry.title}
            className="group block size-full rounded-tile ring-2 ring-accent focus-ring"
          >
            <Badge entry={entry} />
            <span aria-hidden="true" className="absolute inset-0 rounded-tile bg-bg-main/70 flex items-center justify-center text-text-main opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <IconX size={16} />
            </span>
          </button>
        </li>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <li key={`empty-${i}`} className={SLOT}>
          <DropSlot label={T.showcase.addSlot} onClick={onBrowse}>
            <IconPlus size={16} aria-hidden="true" />
          </DropSlot>
        </li>
      ))}
    </ul>
  )
}
