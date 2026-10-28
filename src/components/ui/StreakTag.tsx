import { IconFlame, IconFlameFilled } from '@tabler/icons-react'
import { streakInk, streakTier } from '@/utils/streakTier'

/** What a streak tag says in words, for a screen reader: "Streak: 48 days". */
type Props = {
  /** The streak in days; 0 draws it dimmed, with no flame lit. */
  days: number
  /** What is written beside the flame ("48 d"). */
  text: string
  /** Read aloud in place of `text`. */
  'aria-label'?: string
  /** `md` fits the top bar; `lg` a card's head. */
  size?: 'md' | 'lg'
  /** The lit halo around the tag. Off where the tag sits on a busy surface (the header's streak). */
  glow?: boolean
  /** Layout only. */
  className?: string
}

/**
 * A streak as a tag: a flame and its days, in the colour of its tier (0, 5,
 * 10, 20, 30, 40, 50 days: `streakTier`); lit with a soft glow while a streak
 * is going, dimmed with no streak. Lit tags glow by default (`glow`); the
 * header's streak turns the halo off. The flame is filled only while lit, so
 * the difference is never colour alone.
 */
export default function StreakTag({ days, text, size = 'md', glow = true, className = '', ...aria }: Props) {
  const lit = days > 0
  const tier = streakTier(days)
  const Flame = lit ? IconFlameFilled : IconFlame
  const box = size === 'lg' ? 'h-8 px-3 text-sm gap-1.5 rounded-[0.5rem]' : 'h-[1.5rem] px-2 text-xs gap-1 rounded-tag'

  return (
    <span
      aria-label={aria['aria-label']}
      data-tier={tier.id}
      className={`inline-flex items-center font-extrabold tabular-nums whitespace-nowrap shrink-0 ${box} ${lit ? '' : 'bg-ink/[0.06] text-text-secondary'} ${className}`}
      style={
        lit
          ? {
              backgroundColor: `rgb(${tier.color} / 0.16)`,
              color: streakInk(tier),
              boxShadow: `inset 0 0 0 1px rgb(${tier.color} / 0.35)${glow ? `, 0 0 14px rgb(${tier.color} / 0.22)` : ''}`,
            }
          : undefined
      }
    >
      <Flame size={size === 'lg' ? 16 : 13} aria-hidden="true" style={lit && glow ? { filter: `drop-shadow(0 0 4px rgb(${tier.color} / 0.6))` } : undefined} />
      <span aria-hidden={aria['aria-label'] ? true : undefined}>{text}</span>
    </span>
  )
}
