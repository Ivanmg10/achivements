import { render, screen } from '@testing-library/react'
import MasteryMix from './MasteryMix'
import { en } from '@/translations/en'
import type { UserAwards } from '@/types/types'

const awards = (over: Partial<UserAwards> = {}) =>
  ({ TotalAwardsCount: 27, MasteryAwardsCount: 7, CompletionAwardsCount: 2, BeatenHardcoreAwardsCount: 15, BeatenSoftcoreAwardsCount: 3, EventAwardsCount: 0, VisibleUserAwards: [], ...over }) as UserAwards

test('a labelled bar and a legend with every kind and its count', () => {
  render(<MasteryMix awards={awards()} />)
  expect(screen.getByRole('img')).toHaveAccessibleName(`${en.cards.mastered}: 7, ${en.cards.completedSC}: 2, ${en.userStats.beatenHC}: 15, ${en.userStats.beatenSC}: 3`)
  expect(screen.getAllByRole('listitem')).toHaveLength(4)
})

test('no awards, no bar', () => {
  const { container } = render(<MasteryMix awards={awards({ MasteryAwardsCount: 0, CompletionAwardsCount: 0, BeatenHardcoreAwardsCount: 0, BeatenSoftcoreAwardsCount: 0 })} />)
  expect(container).toBeEmptyDOMElement()
})
