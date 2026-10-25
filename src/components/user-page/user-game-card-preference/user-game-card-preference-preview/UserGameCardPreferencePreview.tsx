import type { GameCardStyle } from '@/hooks/useGameCardStyle'

/** A small drawing of a game card in a style, for its choice card: a cover, a title, a bar. Decorative. */
export default function UserGameCardPreferencePreview({ style }: { style: GameCardStyle }) {
  const card = (hue: string) => (
    <span
      className={`flex items-center gap-2 rounded-[0.5rem] p-1.5 ring-1 ring-inset ${style === 'tinted' ? `${hue} ring-ink/[0.12]` : 'bg-bg-card ring-ink/[0.1]'}`}
    >
      <span className="w-6 h-6 rounded-[0.3125rem] bg-ink/25 shrink-0" />
      <span className="flex flex-col gap-1 flex-1">
        <span className="h-1.5 w-2/3 rounded-sm bg-ink/30" />
        <span className="h-1 rounded-sm bg-ink/10"><span className="block h-full w-1/2 rounded-sm bg-accent" /></span>
      </span>
    </span>
  )
  return (
    <span className="flex flex-col gap-1.5 rounded-[0.625rem] bg-bg-main/80 p-2">
      {card('bg-linear-to-r from-accent/35 to-transparent')}
      {card('bg-linear-to-r from-info/35 to-transparent')}
    </span>
  )
}
