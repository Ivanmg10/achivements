import { render, screen } from '@testing-library/react'
import MainPageMastery from './MainPageMastery'
import { en } from '@/translations/en'
import type { UserAwards } from '@/types/types'

function awards(over: Partial<UserAwards> = {}): UserAwards {
  return {
    TotalAwardsCount: 27,
    MasteryAwardsCount: 7,
    CompletionAwardsCount: 2,
    BeatenHardcoreAwardsCount: 15,
    BeatenSoftcoreAwardsCount: 3,
    EventAwardsCount: 0,
    VisibleUserAwards: [],
    ...over,
  }
}

function props(over: Record<string, unknown> = {}) {
  return { awards: awards(), unlockedHC: 1390, unlockedSC: 1600, ...over }
}

test('renders nothing until the awards arrive', () => {
  const { container } = render(<MainPageMastery {...props({ awards: null })} />)
  expect(container).toBeEmptyDOMElement()
})

test('leads with masteries, against every award earned', () => {
  const { container } = render(<MainPageMastery {...props()} />)
  // The headline number is the one set apart in display size.
  const headline = container.querySelector('.text-4xl')!
  expect(headline.textContent).toBe('7')
  expect(headline.parentElement).toHaveTextContent(`${en.cards.mastered} · 27 ${en.userStats.awards.toLowerCase()}`)
})

test('breaks the awards into their kinds, each labelled with its count', () => {
  render(<MainPageMastery {...props()} />)
  const mix = screen.getByRole('img')
  expect(mix.getAttribute('aria-label')).toBe(
    `${en.cards.mastered}: 7, ${en.cards.completedSC}: 2, ${en.userStats.beatenHC}: 15, ${en.userStats.beatenSC}: 3`,
  )
})

test('keeps unlocked totals as supporting numbers, and events only when there are any', () => {
  const { rerender } = render(<MainPageMastery {...props()} />)
  expect(screen.getByText((1390).toLocaleString())).toBeInTheDocument()
  expect(screen.getByText((1600).toLocaleString())).toBeInTheDocument()
  expect(screen.queryByText(en.userStats.events)).not.toBeInTheDocument()

  rerender(<MainPageMastery {...props({ awards: awards({ EventAwardsCount: 4 }) })} />)
  expect(screen.getByText(en.userStats.events)).toBeInTheDocument()
})

test('shows recent masteries when RA reports any', () => {
  const mastery = {
    AwardedAt: '2024-01-01T00:00:00Z', AwardType: 'Mastery', AwardData: 5, AwardDataExtra: 1,
    Title: 'Zelda', ConsoleName: 'SNES', ImageIcon: '/Images/1.png',
  }
  const { rerender } = render(<MainPageMastery {...props()} />)
  expect(screen.queryByText(en.cards.recentMasteries)).not.toBeInTheDocument()

  rerender(<MainPageMastery {...props({ awards: awards({ VisibleUserAwards: [mastery] }) })} />)
  expect(screen.getByText(en.cards.recentMasteries)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Zelda/ }).getAttribute('href')).toBe('/gameInfo/5')
})

test('shows a placeholder while loading', () => {
  const { container } = render(<MainPageMastery {...props({ isLoading: true })} />)
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
})
