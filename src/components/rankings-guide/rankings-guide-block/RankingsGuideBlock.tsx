import { SURFACE } from '@/components/ui/surface'

/**
 * One part of the guide, as a card: its heading on the left (it stays in view
 * while a long part scrolls on a wide screen), what it means on the right, its
 * rules as a plain list, and any table or chart under them. Parts are topics,
 * not steps: no numbers.
 */
export default function RankingsGuideBlock({
  index,
  heading,
  text,
  points,
  children,
}: {
  /** The part's place in the guide, for its heading's id. */
  index: number
  heading: string
  text: string
  points?: string[]
  children?: React.ReactNode
}) {
  return (
    <section aria-labelledby={`guide-${index}`} className={`enter-card ${SURFACE} p-5 sm:p-7 grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10`}>
      <h2 id={`guide-${index}`} className="lg:sticky lg:top-24 self-start text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">{heading}</h2>
      <div className="flex flex-col gap-4 min-w-0">
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{text}</p>
        {points && (
          <ul className="list-disc pl-5 flex flex-col gap-2 text-sm sm:text-base text-text-secondary leading-relaxed">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  )
}
