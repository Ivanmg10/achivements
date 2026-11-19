'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview } from '@/utils/friends'
import { buttonClass } from '@/components/ui/Button'
import { ChartCard } from '@/components/ui/ChartCard'
import Facts from '@/components/ui/Facts'
import Kicker from '@/components/ui/Kicker'
import MainPageFriendsCard from '../main-page-friends-card/MainPageFriendsCard'

const SHOWN = 3
const PEEK = 3

/** On two columns (sm to xl) the fourth card fills the row, so it is shown there and peeks elsewhere. Each card sits in a grid so a row stays one height. */
const FOURTH_SHOWN = 'hidden sm:grid xl:hidden'
const FOURTH_PEEK = 'sm:hidden xl:grid'

/**
 * Who you follow, folded: the first cards, the top of the next ones under a
 * fade (decoration, out of reach of the keyboard and screen readers) and a
 * link to `/following`, where everyone is.
 */
export default function MainPageFriendsCards({ friends, weeks }: { friends: FriendOverview[]; weeks: Record<string, number | null> }) {
  const { T, lang } = useLanguage()
  const more = friends.length > SHOWN
  const card = (f: FriendOverview, className = 'grid') => (
    <div key={f.username} className={className}>
      <MainPageFriendsCard friend={f} week={weeks[f.username] ?? null} />
    </div>
  )

  return (
    <ChartCard className="h-auto!">
      <Kicker as="h3">
        <Facts items={[T.friends.cards, <span key="n" className="tabular-nums">{friends.length.toLocaleString(lang)}</span>]} />
      </Kicker>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 enter-cards">
        {friends.slice(0, SHOWN).map((f) => card(f))}
        {friends[SHOWN] && card(friends[SHOWN], FOURTH_SHOWN)}
      </div>
      {more && (
        <>
          <div
            inert
            aria-hidden="true"
            data-testid="friends-peek"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 h-20 -mb-2 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]"
          >
            {friends.slice(SHOWN, SHOWN + PEEK + 1).map((f, i) => card(f, i === 0 ? `grid ${FOURTH_PEEK}` : undefined))}
          </div>
          <Link href="/following" className={buttonClass('secondary', 'md', 'self-center')}>
            {T.friends.seeMore}
          </Link>
        </>
      )}
    </ChartCard>
  )
}
