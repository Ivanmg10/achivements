import { SURFACE } from '@/components/ui/surface'

/**
 * One part of the guide, as a card: its number in the display face with the
 * heading on the left (they stay in view while a long part scrolls on a wide
 * screen), what it means on the right, its rules as marked cards, and any
 * table or chart under them.
 */
export default function RankingsGuideBlock({
  index,
  heading,
  text,
  points,
  children,
}: {
  /** The part's place in the guide, shown as 01, 02… */
  index: number
  heading: string
  text: string
  points?: string[]
  children?: React.ReactNode
}) {
  return (
    <section aria-labelledby={`guide-${index}`} className={`${SURFACE} p-5 sm:p-7 grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10`}>
      <div className="lg:sticky lg:top-24 self-start flex flex-col gap-2">
        <span aria-hidden="true" className="font-display italic font-extrabold text-6xl leading-[0.85] text-accent pr-2">
          {String(index).padStart(2, '0')}
        </span>
        <h2 id={`guide-${index}`} className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">{heading}</h2>
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{text}</p>
        {points && (
          <ul className="flex flex-col gap-2">
            {points.map((p) => (
              <li
                key={p}
                className="relative rounded-[0.875rem] bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] py-3 pl-6 pr-4 text-sm sm:text-base text-text-secondary leading-relaxed before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[3px] before:bg-accent before:-skew-y-[20deg]"
              >
                {p}
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  )
}
