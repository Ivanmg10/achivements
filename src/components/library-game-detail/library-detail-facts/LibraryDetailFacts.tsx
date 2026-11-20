import Figure, { FIGURES_BY_THREE, type FigureTone } from '@/components/ui/Figure'

export type DetailFact = { label: string; value: string; tone?: FigureTone }

/** A game's figures as one row that spreads over the width (#169): what is left, the pace, the points, the playtime. */
export default function LibraryDetailFacts({ facts }: { facts: DetailFact[] }) {
  if (facts.length === 0) return null
  return (
    <dl className={FIGURES_BY_THREE}>
      {facts.map((f) => (
        <Figure key={f.label} term label={f.label} value={f.value} tone={f.tone} />
      ))}
    </dl>
  )
}
