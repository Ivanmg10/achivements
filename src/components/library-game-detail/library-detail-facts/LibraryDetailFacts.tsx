export type DetailFact = { label: string; value: string; className?: string }

/** A game's figures as a row of tiles: what is left, the pace, the points, the playtime. */
export default function LibraryDetailFacts({ facts }: { facts: DetailFact[] }) {
  if (facts.length === 0) return null
  return (
    <dl className="flex flex-wrap gap-2">
      {facts.map((f) => (
        <div key={f.label} className="bg-bg-main/55 ring-1 ring-ink/[0.06] rounded-control px-3 py-2 flex flex-col min-w-28">
          <dt className="text-[10px] uppercase tracking-wide text-text-secondary">{f.label}</dt>
          <dd className={`text-base font-bold tabular-nums ${f.className ?? 'text-text-main'}`}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
