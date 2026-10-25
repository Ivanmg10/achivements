export type DetailFact = { label: string; value: string; className?: string }

/** A game's figures as a row of tiles: what is left, the pace, the points, the playtime. */
export default function LibraryDetailFacts({ facts }: { facts: DetailFact[] }) {
  if (facts.length === 0) return null
  return (
    <dl className="flex flex-wrap gap-2">
      {facts.map((f) => (
        <div key={f.label} className="bg-bg-main/55 ring-1 ring-inset ring-ink/[0.06] rounded-[0.625rem] px-3 py-2.5 flex flex-col gap-0.5">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-text-secondary">{f.label}</dt>
          <dd className={`text-xl font-extrabold tabular-nums ${f.className ?? 'text-text-main'}`}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
