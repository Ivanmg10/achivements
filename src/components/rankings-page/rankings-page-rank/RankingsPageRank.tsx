'use client'

import { useLanguage } from '@/context/LanguageContext'

/**
 * A place in the rankings. When someone else holds it too (equal points) it
 * reads "3=", and "tied" to a screen reader, so a podium that ends at 3 and a
 * table that starts at 3 and jumps to 5 do not look like a fault.
 */
export default function RankingsPageRank({ rank, tied = false }: { rank: number; tied?: boolean }) {
  const { T } = useLanguage()
  return (
    <>
      {rank}
      {tied && (
        <>
          <span aria-hidden="true">=</span>
          <span className="sr-only"> {T.rankings.tied}</span>
        </>
      )}
    </>
  )
}
