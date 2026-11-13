import Kicker from '@/components/ui/Kicker'
export type GameExpandedStat = {
  label: string
  value: string
  className: string
  /** False leaves it out in a wide card, where the ring already says it. */
  wide?: boolean
}

/**
 * The stats beside the ring of an expanded game (under it in a wide card, in
 * a narrow column), a line each: a label too long to share the line goes on its
 * own and the value stays whole below it, in any language.
 */
export default function GameExpandedStatList({ stats }: { stats: GameExpandedStat[] }) {
  return (
    <dl className="flex flex-col gap-2.5 flex-1 min-w-0 @3xl:flex-none @3xl:w-full @3xl:gap-2">
      {stats.map((s) => (
        <div key={s.label} className={`flex flex-wrap items-baseline justify-between gap-x-3 ${s.wide === false ? '@3xl:hidden' : ''}`}>
          <Kicker as="dt" className="min-w-0 leading-tight">{s.label}</Kicker>
          <dd className={`ml-auto text-base font-extrabold tabular-nums whitespace-nowrap ${s.className}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}
