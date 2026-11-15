'use client'

import { Fragment, useState, type ReactNode } from 'react'
import { capList } from '@/utils/utils'
import { useBadgeTooltip } from '@/hooks/useBadgeTooltip'
import ShowAllButton from '@/components/show-all-button/ShowAllButton'
import CursorTooltip from '@/components/ui/CursorTooltip'
import { Skeleton } from '@/components/ui/Skeleton'
import BadgeGridBadge, { BADGE_SIZES } from './badge-grid-badge/BadgeGridBadge'
import type { BadgePins, BadgeReveal, BadgeSection, BadgeTip } from '@/types/badgeGrid'

/** What a platform tells the badge grid about its achievements; the grid draws them and owns the tooltip, the cap and the stars. */
export type BadgeGridProps<T> = {
  items: T[]
  keyOf: (a: T) => string | number
  /** Where a badge goes: a link to the achievement on its game page... */
  href?: (a: T) => string
  /** ...or what it does when pressed (RA opens its window). */
  onSelect?: (a: T) => void
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
  pins?: BadgePins<T>
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
 * greyed, a tooltip on hover or focus, a star to pin, an eye on a secret one, and a cap with "show all".
 * The platform's adapter says what each badge is called, where it goes and what its tooltip says.
 */
export default function BadgeGrid<T>({
  items,
  keyOf,
  href,
  onSelect,
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
  pins,
  tip,
  corner,
  sections,
  loading = false,
}: BadgeGridProps<T>) {
  const { tip: shownTip, show, hide } = useBadgeTooltip<T>()
  const [showAll, setShowAll] = useState(false)
  const { visible: shown, capped } = capList(items, limit ?? Infinity, showAll)
  const dims = BADGE_SIZES[badgeSize]

  const isConcealed = (a: T) => !!secret?.(a) && !reveal?.isRevealed(a)
  const parts = sections ? sections.split(shown) : [{ id: '', items: shown }]

  const list = (part: BadgeSection<T>) => (
    <ul className={loading ? 'hidden' : 'flex flex-wrap gap-1'}>
      {part.items.map((a) => {
        const concealed = isConcealed(a)
        const text = name(a, concealed)
        return (
          <BadgeGridBadge
            key={keyOf(a)}
            href={href?.(a)}
            onSelect={onSelect && (() => onSelect(a))}
            label={label(a, text)}
            ring={ring?.(a)}
            earned={earned(a)}
            iconUrl={concealed && !keepSecretIcon ? null : icon(a)}
            size={badgeSize}
            corner={corner?.(a)}
            eye={reveal && secret?.(a) ? { revealed: reveal.isRevealed(a), onToggle: () => reveal.toggle(a), labels: reveal.labels } : undefined}
            pin={pins?.canPin ? { pinned: pins.isPinned(a), title: text, onToggle: () => pins.toggle(a) } : undefined}
            onShow={(x, y, delay) => show(a, x, y, delay)}
            onHide={hide}
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
        <div className="flex flex-wrap gap-1">
          {shown.map((a) => (
            <Skeleton key={keyOf(a)} radius="tile" className={dims.badge} />
          ))}
        </div>
      )}
      {parts.map((part) => (
        <Fragment key={part.id}>{sections && parts.length > 1 ? sections.wrap(part.id, list(part)) : list(part)}</Fragment>
      ))}
      {!loading && capped && <ShowAllButton total={items.length} expanded={showAll} onToggle={() => setShowAll((v) => !v)} />}

      {shownTip && details && (
        <CursorTooltip x={shownTip.x} y={shownTip.y}>
          <p className="text-sm font-semibold text-text-main">{name(shownTip.item, tipConcealed)}</p>
          <p className="text-xs text-text-secondary mt-1 leading-snug">{details.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">{details.chips}</div>
          {details.date && <p className="text-xs text-text-secondary mt-1">{details.date}</p>}
        </CursorTooltip>
      )}
    </>
  )
}

