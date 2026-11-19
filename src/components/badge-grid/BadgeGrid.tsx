'use client'

import { Fragment, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { capList } from '@/utils/utils'
import { useBadgeTooltip } from '@/hooks/useBadgeTooltip'
import CursorTooltip from '@/components/ui/CursorTooltip'
import { Skeleton } from '@/components/ui/Skeleton'
import FoldList, { foldItem } from '@/components/ui/FoldList'
import BadgeGridBadge, { BADGE_SIZES } from './badge-grid-badge/BadgeGridBadge'
import type { BadgeReveal, BadgeSection, BadgeShown, BadgeTip } from '@/types/badgeGrid'

/** What a platform tells the badge grid about its achievements; the grid draws them and owns the tooltip, the cap and the open window. */
export type BadgeGridProps<T> = {
  items: T[]
  keyOf: (a: T) => string | number
  /** The achievement's window, opened by pressing its badge (every platform, #164): pinning is done there. */
  detail?: (a: T, shown: BadgeShown, onClose: () => void) => ReactNode
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest (a card on a list page). */
  limit?: number
  /** The name a badge shows and is read by; `concealed`: a secret one still hidden. */
  name: (a: T, concealed: boolean) => string
  /** The accessible label, with the name and the state (earned, locked, grade). */
  label: (a: T, name: string) => string
  earned: (a: T) => boolean
  /** The ring a badge wears; none leaves it bare (earned ones, on most platforms). */
  ring?: (a: T) => string | undefined
  /** Its picture; null shows the stand-in. */
  icon: (a: T) => string | null
  /** A secret one, still unearned: its text stays hidden until the viewer asks (`reveal`) or it is earned. */
  secret?: (a: T) => boolean
  /** Steam keeps a secret one's picture; the others stand it in. */
  keepSecretIcon?: boolean
  reveal?: BadgeReveal<T>
  tip: (a: T, concealed: boolean) => BadgeTip
  /** Over a badge's corner (RA's missable mark). */
  corner?: (a: T) => ReactNode
  /** Split the shown badges into parts (PSN's DLC groups); the wrapper draws each part's fold. */
  sections?: { split: (shown: T[]) => BadgeSection<T>[]; wrap: (id: string, list: ReactNode) => ReactNode }
  /** The pictures are still on their way: show skeletons for what is shown, and keep the badges (loading) out of sight. */
  loading?: boolean
}

/**
 * A game's achievements as a grid of badges, the same on every platform: earned ones ringed, locked ones
 * greyed, a tooltip on hover or focus, an eye on a secret one, a cap with "show all", and the achievement's
 * window when a badge is pressed. The platform's adapter says what each badge is called, what its tooltip
 * says and which window it opens.
 */
export default function BadgeGrid<T>({
  items,
  keyOf,
  detail,
  badgeSize = 48,
  limit,
  name,
  label,
  earned,
  ring,
  icon,
  secret,
  keepSecretIcon = false,
  reveal,
  tip,
  corner,
  sections,
  loading = false,
}: BadgeGridProps<T>) {
  const { T } = useLanguage()
  const { tip: shownTip, show, hide } = useBadgeTooltip<T>()
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<T | null>(null)
  const { visible: shown, capped } = capList(items, limit ?? Infinity, showAll)
  const dims = BADGE_SIZES[badgeSize]
  const place = new Map(shown.map((a, i) => [keyOf(a), i]))

  const isConcealed = (a: T) => !!secret?.(a) && !reveal?.isRevealed(a)
  const iconOf = (a: T, concealed: boolean) => (concealed && !keepSecretIcon ? null : icon(a))
  const shownOf = (a: T): BadgeShown => {
    const concealed = isConcealed(a)
    return { concealed, title: name(a, concealed), text: tip(a, concealed).description, iconUrl: iconOf(a, concealed) }
  }
  const parts = sections ? sections.split(shown) : [{ id: '', items: shown }]

  const list = (part: BadgeSection<T>) => (
    <ul className={loading ? 'hidden' : 'flex flex-wrap content-start gap-1'}>
      {part.items.map((a) => {
        const concealed = isConcealed(a)
        const text = name(a, concealed)
        return (
          <BadgeGridBadge
            key={keyOf(a)}
            onSelect={detail && (() => setSelected(a))}
            label={label(a, text)}
            ring={ring?.(a)}
            earned={earned(a)}
            iconUrl={iconOf(a, concealed)}
            size={badgeSize}
            corner={corner?.(a)}
            eye={reveal && secret?.(a) ? { revealed: reveal.isRevealed(a), onToggle: () => reveal.toggle(a), labels: reveal.labels } : undefined}
            onShow={(x, y, delay) => show(a, x, y, delay)}
            onHide={hide}
            fold={limit === undefined ? undefined : foldItem(place.get(keyOf(a)) ?? 0, limit)}
          />
        )
      })}
    </ul>
  )

  const tipConcealed = shownTip ? isConcealed(shownTip.item) : false
  const details = shownTip ? tip(shownTip.item, tipConcealed) : null

  return (
    <>
      {loading && (
        <div className="flex flex-wrap content-start gap-1">
          {shown.map((a) => (
            <Skeleton key={keyOf(a)} radius="tile" className={dims.badge} />
          ))}
        </div>
      )}
      <FoldList
        folded={!showAll}
        onToggle={() => setShowAll((v) => !v)}
        hasMore={!loading && capped}
        more={T.statusGameItem.showAllAchievements.replace('{n}', String(items.length))}
        less={T.statusGameItem.showFewerAchievements}
        size="sm"
        buttonClassName="self-start mt-2"
      >
        {parts.map((part) => (
          <Fragment key={part.id}>{sections && parts.length > 1 ? sections.wrap(part.id, list(part)) : list(part)}</Fragment>
        ))}
      </FoldList>

      {shownTip && details && (
        <CursorTooltip x={shownTip.x} y={shownTip.y}>
          <p className="text-sm font-semibold text-text-main">{name(shownTip.item, tipConcealed)}</p>
          <p className="text-xs text-text-secondary mt-1 leading-snug">{details.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">{details.chips}</div>
          {details.date && <p className="text-xs text-text-secondary mt-1">{details.date}</p>}
        </CursorTooltip>
      )}

      <AnimatePresence>
        {detail && selected && <Fragment key={keyOf(selected)}>{detail(selected, shownOf(selected), () => setSelected(null))}</Fragment>}
      </AnimatePresence>
    </>
  )
}

