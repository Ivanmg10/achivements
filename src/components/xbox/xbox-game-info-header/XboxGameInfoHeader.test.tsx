jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({ __esModule: true, default: () => <span data-testid="hide" /> }))

import { render, screen } from '@testing-library/react'
import XboxGameInfoHeader from './XboxGameInfoHeader'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({
  id: 1738914043, titleId: '1738914043', title: 'Halo Infinite', consoleName: 'Xbox Series · PC',
  numAwarded: 12, maxPossible: 119, totalKnown: true, pctWon: 19, earnedGamerscore: 340, totalGamerscore: 1750,
  lastPlayed: '2026-01-02T00:00:00Z',
})

test('title as the page heading, platform, progress and facts', () => {
  render(<XboxGameInfoHeader game={GAME} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Halo Infinite')
  expect(screen.getAllByText('Xbox Series · PC').length).toBeGreaterThan(0)
  expect(screen.getByText(en.gameStatus.inProgress)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo Infinite' })).toHaveAttribute('aria-valuenow', '19')
  expect(screen.getByText(en.gameInfoPage.ofAchievements.replace('{n}', '12').replace('{total}', '119'))).toBeInTheDocument()
  // The tiles: the part, then the whole.
  expect(screen.getByText(en.xbox.achievements).nextElementSibling).toHaveTextContent('12 / 119')
  expect(screen.getByText(en.xbox.gamerscore).nextElementSibling).toHaveTextContent('340 / 1750')
  expect(screen.getByTestId('pin')).toBeInTheDocument()
  expect(screen.getByTestId('hide')).toBeInTheDocument()
})

test('a game whose total Xbox does not say shows only what is earned', () => {
  render(<XboxGameInfoHeader game={{ ...GAME, totalKnown: false, maxPossible: 0, numAwarded: 15 }} />)
  expect(screen.queryByText(/\/ 0$/)).not.toBeInTheDocument()
  expect(screen.getAllByText('15').length).toBeGreaterThan(0)
})

test('a game at 100 % is perfect, not in progress', () => {
  render(<XboxGameInfoHeader game={{ ...GAME, pctWon: 100 }} />)
  expect(screen.getByText(`★ ${en.steam.perfect}`)).toBeInTheDocument()
  expect(screen.queryByText(en.gameStatus.inProgress)).not.toBeInTheDocument()
})

const DETAILS = {
  summary: 'The Master Chief returns.',
  developers: ['343 Industries'],
  publishers: ['Xbox Game Studios'],
  genres: ['Shooter'],
  releaseDate: '2021-12-08',
  screenshots: [
    { thumb: 't1.jpg', full: 'f1.jpg' },
    { thumb: 't2.jpg', full: 'f2.jpg' },
  ],
}

test("IGDB's facts: summary, studios, genre, release date and two screenshots", () => {
  render(<XboxGameInfoHeader game={GAME} details={DETAILS} />)
  expect(screen.getByText('The Master Chief returns.')).toBeInTheDocument()
  expect(screen.getByText('343 Industries')).toBeInTheDocument()
  expect(screen.getByText('Xbox Game Studios')).toBeInTheDocument()
  expect(screen.getByText('Shooter')).toBeInTheDocument()
  // A date-only value, read as UTC: never a day early.
  expect(screen.getByText(/Dec 8, 2021|8 Dec 2021/)).toBeInTheDocument()
  expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('f'))).toHaveLength(2)
})

test('without details, "no data", and no summary or screenshots', () => {
  render(<XboxGameInfoHeader game={GAME} />)
  expect(screen.getAllByText(en.gameInfoPage.noData).length).toBeGreaterThanOrEqual(4)
})

test('extra actions go beside the facts, and nothing is drawn without them', () => {
  const { rerender } = render(<XboxGameInfoHeader game={GAME} />)
  expect(screen.queryByRole('button', { name: 'Ask' })).toBeNull()
  rerender(<XboxGameInfoHeader game={GAME} actions={<button>Ask</button>} />)
  expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument()
})
