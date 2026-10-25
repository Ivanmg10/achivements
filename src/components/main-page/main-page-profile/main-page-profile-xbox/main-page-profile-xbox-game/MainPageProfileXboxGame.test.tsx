import { render, screen } from '@testing-library/react'
import MainPageProfileXboxGame from './MainPageProfileXboxGame'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'
import { en } from '@/translations/en'

const GAME = xboxGameFixture({
  id: 1738914043, title: 'Halo', consoleName: 'Xbox Series', maxPossible: 45, numAwarded: 20, totalKnown: true, pctWon: 44,
  earnedGamerscore: 440, totalGamerscore: 1000, lastPlayed: '2026-01-02T00:00:00Z',
})

test('the last game played, with its progress and gamerscore, opening its page', () => {
  render(<MainPageProfileXboxGame game={GAME} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/xboxGame/1738914043')
  expect(screen.getByText('Halo')).toBeInTheDocument()
  expect(screen.getByText('44 %')).toBeInTheDocument()
  expect(screen.getByText('440')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '44')
})

test('a finished game is marked in the "done" colour', () => {
  render(<MainPageProfileXboxGame game={{ ...GAME, pctWon: 100 }} />)
  expect(screen.getByText('100 %')).toHaveClass('text-success')
})

const MINUTES = 3409
const PLAYED = formatPlaytime(MINUTES, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en')

test('the play time beside the console', () => {
  render(<MainPageProfileXboxGame game={{ ...GAME, playtimeMinutes: MINUTES }} />)
  expect(screen.getByText(new RegExp(`Xbox Series · ${PLAYED}`))).toBeInTheDocument()
})
