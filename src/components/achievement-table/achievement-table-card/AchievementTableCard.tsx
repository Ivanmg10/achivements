import { Fragment, type ReactNode } from 'react'
import Image from 'next/image'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { AchievementColumn, AchievementView, TableTexts } from '@/types/achievementTable'
import { earnedRing, type TableEntry } from '@/utils/achievementTable'
import { formatRarity, formatUnlock } from '@/utils/steamFeed'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import RevealSecretButton from '@/components/reveal-secret-button/RevealSecretButton'

/**
 * One achievement as a card, for the phone: the whole card opens it, through a
 * button stretched over it, with the eye and the pin above that. It carries no
 * anchor: the table row does, and only one of the two is ever on screen.
 */
export default function AchievementTableCard<T>({
  view,
  columns,
  tags,
  texts,
  unoptimized,
}: {
  view: AchievementView<T>
  columns: AchievementColumn<T>[]
  tags?: (e: TableEntry<T>) => ReactNode
  texts: Pick<TableTexts, 'earned' | 'locked'>
  unoptimized: boolean
}) {
  const { T, lang } = useLanguage()
  const { entry: e, eye } = view
  const { row } = e

  return (
    <li
      data-anchor={row.anchor}
      className={`relative flex items-start gap-3 rounded-tile p-3 transition-colors duration-500 ${
        view.highlighted ? 'bg-accent/15' : view.pinned ? 'bg-warning/10' : 'bg-bg-main/40'
      }`}
    >
      <button type="button" onClick={view.onOpen} aria-label={view.title} className="absolute inset-0 rounded-tile focus-ring" />
      <div className="relative shrink-0 pointer-events-none">
        {view.iconUrl ? (
          <Image
            src={view.iconUrl}
            alt=""
            width={48}
            height={48}
            className={`w-12 h-12 rounded-box object-cover ${row.earned ? `ring-2 ${earnedRing(row)}` : 'grayscale opacity-50'}`}
            unoptimized={unoptimized}
          />
        ) : (
          <div className="w-12 h-12 rounded-box bg-ink/10" aria-hidden="true" />
        )}
        {/* No hover on a phone: the eye is always there. */}
        {eye && <RevealSecretButton {...eye} className="z-10 pointer-events-auto w-8 h-8" />}
      </div>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <h3 className={`text-sm font-semibold ${row.earned ? '' : 'text-text-secondary'}`}>{view.title}</h3>
        <p className="text-xs text-text-secondary">{view.text}</p>
        <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1">
          {columns.map((c) => c.card && <Fragment key={c.key}>{c.card(e)}</Fragment>)}
          {row.earned ? (
            <span className="inline-flex items-center gap-1 text-success">
              <IconCheck size={12} aria-hidden="true" />
              {row.earnedAt ? formatUnlock(row.earnedAt, lang) : texts.earned}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-secondary">
              <IconLock size={12} aria-hidden="true" />
              {texts.locked}
            </span>
          )}
          {row.rarity !== null && (
            <span className="text-text-secondary">
              {formatRarity(row.rarity, lang)}
              {T.achievement.haveIt}
            </span>
          )}
          {tags?.(e)}
        </div>
      </div>

      {view.pinned !== undefined && (
        <SteamPinAchievementButton pinned={view.pinned} title={view.title} onToggle={view.onTogglePin} className="relative z-10 shrink-0 mt-0.5" />
      )}
    </li>
  )
}
