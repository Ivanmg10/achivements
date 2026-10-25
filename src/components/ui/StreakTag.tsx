import { IconFlame, IconFlameFilled } from '@tabler/icons-react'

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
  /** Layout only. */
  className?: string
}

/**
 * A streak as a tag: a flame and its days. A streak going is lit (the accent,
 * tinted, ringed and with a soft glow); none is dimmed. The flame is filled
 * only while lit, so the difference is never colour alone.
 */
export default function StreakTag({ days, text, size = 'md', className = '', ...aria }: Props) {
  const lit = days > 0
  const Flame = lit ? IconFlameFilled : IconFlame
  const box = size === 'lg' ? 'h-8 px-3 text-sm gap-1.5 rounded-[0.5rem]' : 'h-[1.5rem] px-2 text-xs gap-1 rounded-[0.375rem]'

  return (
    <span
      aria-label={aria['aria-label']}
      className={`inline-flex items-center font-extrabold tabular-nums whitespace-nowrap shrink-0 ${box} ${
        lit ? 'bg-accent/[0.14] text-accent ring-1 ring-inset ring-accent/30 shadow-[0_0_14px_rgb(var(--accent)/0.22)]' : 'bg-ink/[0.06] text-text-secondary'
      } ${className}`}
    >
      <Flame size={size === 'lg' ? 16 : 13} aria-hidden="true" className={lit ? 'drop-shadow-[0_0_4px_rgb(var(--accent)/0.6)]' : ''} />
      <span aria-hidden={aria['aria-label'] ? true : undefined}>{text}</span>
    </span>
  )
}
