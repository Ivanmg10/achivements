import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingLibrary from './LandingLibrary'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

test('says what the library is, beside the example games, every platform at once', () => {
  render(<LandingLibrary />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.libraryTitle })).toBeInTheDocument()
  for (const g of SAMPLE_GAMES) expect(screen.getByText(g.title)).toBeInTheDocument()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
})

test('a PS5 game among them, and no Xbox while Xbox is admin-only', () => {
  render(<LandingLibrary />)
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.queryByText(/xbox/i)).not.toBeInTheDocument()
})

test('opening a game hides the others until it closes, as the home feed does', async () => {
  render(<LandingLibrary />)
  const [first, ...rest] = SAMPLE_GAMES.filter((g) => g.appId)
  await userEvent.click(screen.getByRole('button', { name: `${en.cards.showAchievements}: ${first.title}` }))
  for (const g of SAMPLE_GAMES.filter((g) => g !== first)) expect(screen.queryByText(g.title)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: `${en.cards.hideAchievements}: ${first.title}` }))
  for (const g of rest) expect(await screen.findByText(g.title)).toBeInTheDocument()
  expect(within(document.body).getAllByRole('listitem').length).toBeGreaterThanOrEqual(SAMPLE_GAMES.length)
})
