import { render, screen } from '@testing-library/react'
import BrowseSplit from './BrowseSplit'
import { en } from '@/translations/en'

test('both platforms on each count, named in text and not only by colour', () => {
  render(<BrowseSplit ra={{ started: 70, unlocked: 1391, perfect: 9 }} steam={{ started: 137, unlocked: 2469, perfect: 15 }} />)
  for (const label of [en.cards.splitGames, en.cards.splitUnlocked, en.cards.splitPerfect]) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  expect(screen.getAllByText('RetroAchievements:', { exact: false })).toHaveLength(3)
  expect(screen.getByText((1391).toLocaleString())).toBeInTheDocument()
  expect(screen.getByText((2469).toLocaleString())).toBeInTheDocument()
})

test('PSN joins as a third bar on each count when linked', () => {
  render(
    <BrowseSplit
      ra={{ started: 1, unlocked: 1, perfect: 1 }}
      steam={{ started: 2, unlocked: 2, perfect: 2 }}
      psn={{ started: 23, unlocked: 765, perfect: 8 }}
    />,
  )
  expect(screen.getAllByText('PlayStation:', { exact: false })).toHaveLength(3)
  expect(screen.getByText('765')).toBeInTheDocument()
})
