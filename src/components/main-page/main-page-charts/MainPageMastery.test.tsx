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

function started(id: number, title: string, awarded: number, total: number) {
  return {
    GameID: id, Title: title, ImageIcon: `/Images/${id}.png`, ConsoleID: 1, ConsoleName: 'SNES',
    MaxPossible: total, NumAwarded: awarded, PctWon: String(awarded / total), HardcoreMode: '0',
  }
}

test('lists the started games closest to a mastery, nearest first', () => {
  const inProgress = [
    started(1, 'Far off', 2, 10),
    started(2, 'Nearly there', 9, 10),
    started(3, 'Halfway', 5, 10),
    started(4, 'Just begun', 1, 10),
  ]
  render(<MainPageMastery {...props({ inProgress })} />)

  expect(screen.getByText(en.cards.closestToPerfect)).toBeInTheDocument()
  const titles = screen.getAllByRole('link').map((l) => l.textContent)
  expect(titles[0]).toContain('Nearly there')
  expect(titles[0]).toContain('90%')
  expect(titles[0]).toContain('9/10')
  // Three is the list; the fourth game is not on it.
  expect(screen.queryByText('Just begun')).not.toBeInTheDocument()
})

test('a game on the list links to its RA page', () => {
  render(<MainPageMastery {...props({ inProgress: [started(42, 'Metroid', 9, 10)] })} />)
  expect(screen.getByRole('link', { name: /Metroid/ }).getAttribute('href')).toBe('/gameInfo/42')
})

test('nothing started means no list at all, rather than an empty heading', () => {
  render(<MainPageMastery {...props()} />)
  expect(screen.queryByText(en.cards.closestToPerfect)).not.toBeInTheDocument()
})
