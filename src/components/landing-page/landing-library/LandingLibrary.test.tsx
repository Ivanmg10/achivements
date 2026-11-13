import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingLibrary from './LandingLibrary'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

test('says what the library is, beside a labelled example of its list', () => {
  render(<LandingLibrary />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.libraryTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.example)).toBeInTheDocument()
  expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(SAMPLE_GAMES.length)
})

test('its platform tabs work: one platform\'s games, then all again', async () => {
  render(<LandingLibrary />)
  await userEvent.click(screen.getByRole('tab', { name: 'Steam' }))
  const steam = SAMPLE_GAMES.filter((g) => g.source === 'steam')
  const panel = screen.getByRole('tabpanel')
  expect(within(panel).getAllByRole('listitem')).toHaveLength(steam.length)
  for (const g of steam) expect(within(panel).getByText(g.title)).toBeInTheDocument()
  expect(panel).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: 'Steam' }).id)
  await userEvent.click(screen.getByRole('tab', { name: en.rankings.allPlatforms }))
  expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(SAMPLE_GAMES.length)
})

test('no Xbox tab while Xbox is admin-only', () => {
  render(<LandingLibrary />)
  expect(screen.queryByRole('tab', { name: /xbox/i })).not.toBeInTheDocument()
})

test('opening a game hides the others until it closes, as the home feed does', async () => {
  render(<LandingLibrary />)
  const [first, ...rest] = SAMPLE_GAMES.filter((g) => g.appId)
  await userEvent.click(screen.getByRole('button', { name: `${en.cards.showAchievements}: ${first.title}` }))
  for (const g of SAMPLE_GAMES.filter((g) => g !== first)) expect(screen.queryByText(g.title)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: `${en.cards.hideAchievements}: ${first.title}` }))
  for (const g of rest) expect(screen.getByText(g.title)).toBeInTheDocument()
})
