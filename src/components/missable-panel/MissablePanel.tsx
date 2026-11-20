'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { AchievementView } from '@/types/achievementTable'
import { useLocationHash } from '@/hooks/useLocationHash'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { plural } from '@/utils/utils'
import AccordionItem from '@/components/ui/Accordion'
import ListRow from '@/components/ui/ListRow'

/** The panel's id: the hero's "N missables" chip links to it (`#missables`), which opens it. */
export const MISSABLES_ID = 'missables'

/**
 * The achievements a game can still lose, folded above its table in the
 * danger tone: the head says how many, and open it lists each one (badge,
 * title, description); a row opens the same window the table opens.
 */
export default function MissablePanel<T>({ views, unoptimized }: { views: AchievementView<T>[]; unoptimized: boolean }) {
  const { T, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const hash = useLocationHash()

  useWhenChanged([hash], () => {
    if (hash === `#${MISSABLES_ID}`) setOpen(true)
  })

  if (views.length === 0) return null

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    // Folded by hand: drop the fragment, so the chip's link opens it again.
    if (!next && window.location.hash === `#${MISSABLES_ID}`) window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
    <AccordionItem
      id={MISSABLES_ID}
      tone="danger"
      open={open}
      onOpenChange={onOpenChange}
      className="scroll-mt-24"
      title={
        <span className="flex items-center gap-2.5">
          <IconAlertTriangle className="w-4 h-4 shrink-0 text-danger" aria-hidden="true" />
          <span>
            <strong className="font-bold text-danger">{plural(views.length, T.plurals.missableCount, lang)}</strong> {T.gameInfoTable.missableText}
          </span>
        </span>
      }
    >
      <ul className="flex flex-col gap-1 -ml-2.5">
        {views.map((v) => (
          <li key={v.entry.row.id}>
            <ListRow
              onClick={v.onOpen}
              wrap
              media={v.iconUrl ? <Image src={v.iconUrl} alt="" width={40} height={40} className="w-10 h-10 object-cover grayscale opacity-60" unoptimized={unoptimized} /> : null}
              title={<span className="text-text-main">{v.title}</span>}
              sub={v.text}
            />
          </li>
        ))}
      </ul>
    </AccordionItem>
  )
}
