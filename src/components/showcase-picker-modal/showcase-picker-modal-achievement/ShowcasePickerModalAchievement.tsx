'use client'

import { useId } from 'react'
import Image from 'next/image'
import { IconCheck, IconLock, IconTrophy, IconTrophyFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { ShowcaseChoice } from '@/utils/showcase'

/**
 * One achievement of a game in the showcase picker. Earned: a button that
 * selects it (ringed and ticked while selected). Not earned: greyed with a
 * lock, there to see what is left, not to pick. Already in the showcase: says
 * so. `blocked` is the showcase being full with what is already selected.
 * Hovering it, or reaching it with the keyboard, shows what it asks for over
 * the tile, inside it, so the list's edges never cut it off.
 */
export default function ShowcasePickerModalAchievement({
  choice,
  selected,
  inShowcase,
  blocked,
  onToggle,
}: {
  choice: ShowcaseChoice
  selected: boolean
  inShowcase: boolean
  blocked: boolean
  onToggle: () => void
}) {
  const { T } = useLanguage()
  const earned = Boolean(choice.entry)
  const title = choice.concealed ? T.showcase.hidden : choice.title
  const state = inShowcase ? T.showcase.inShowcase : earned ? '' : T.showcase.notEarned
  const disabled = !earned || inShowcase || (blocked && !selected)
  const descriptionId = useId()
  const description = choice.concealed ? null : choice.description

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={earned && !inShowcase ? selected : undefined}
      aria-label={state ? `${title} · ${state}` : title}
      aria-describedby={description ? descriptionId : undefined}
      className={`group relative h-full w-full rounded-xl p-2 flex flex-col items-center gap-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        selected
          ? 'bg-accent/15 ring-2 ring-accent'
          : earned && !inShowcase
            ? 'bg-bg-card ring-1 ring-ink/10 hover:ring-accent/60 hover:-translate-y-0.5'
            : 'bg-bg-card/50'
      } ${disabled && !inShowcase ? 'cursor-default' : ''}`}
    >
      {selected && (
        <span aria-hidden="true" className="absolute right-1.5 top-1.5 w-5 h-5 rounded-full bg-accent text-bg-main flex items-center justify-center">
          <IconCheck size={13} stroke={3} />
        </span>
      )}
      <span className="relative">
        {choice.badge ? (
          <Image
            src={choice.badge}
            alt=""
            width={56}
            height={56}
            className={`w-14 h-14 rounded-lg object-cover ${earned ? '' : 'grayscale opacity-40'}`}
            unoptimized
          />
        ) : (
          <span aria-hidden="true" className="w-14 h-14 rounded-lg bg-ink/10 flex items-center justify-center text-text-secondary">
            <IconTrophy size={22} />
          </span>
        )}
        {!earned && (
          <span aria-hidden="true" className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-bg-main flex items-center justify-center text-text-secondary">
            <IconLock size={11} />
          </span>
        )}
        {inShowcase && (
          <span aria-hidden="true" className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-bg-main flex items-center justify-center text-accent">
            <IconTrophyFilled size={12} />
          </span>
        )}
      </span>
      <span className={`text-[11px] leading-tight line-clamp-2 ${earned ? 'font-medium text-text-main' : 'text-text-secondary'}`}>{title}</span>
      {inShowcase && <span className="text-[10px] font-semibold text-accent">{T.showcase.inShowcase}</span>}
      {description && (
        <span
          id={descriptionId}
          className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-bg-main ring-1 ring-accent/40 p-2 flex flex-col items-center justify-center gap-1 text-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span aria-hidden="true" className="text-[11px] font-semibold text-text-main leading-tight line-clamp-2">{title}</span>
          <span className="text-[10px] text-text-secondary leading-snug line-clamp-5">{description}</span>
        </span>
      )}
    </button>
  )
}
