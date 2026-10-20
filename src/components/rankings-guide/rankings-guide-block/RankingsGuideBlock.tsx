/** One part of the guide: a heading, what it means, and its rules as a list; any table or chart goes under it. */
export default function RankingsGuideBlock({
  heading,
  text,
  points,
  children,
}: {
  heading: string
  text: string
  points?: string[]
  children?: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{heading}</h2>
      <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{text}</p>
      {points && (
        <ul className="flex flex-col gap-2 list-disc pl-5 marker:text-accent">
          {points.map((p) => (
            <li key={p} className="text-sm sm:text-base text-text-secondary leading-relaxed">{p}</li>
          ))}
        </ul>
      )}
      {children}
    </section>
  )
}
