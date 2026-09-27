import { render, screen } from '@testing-library/react'
import MainPageProfileStGame from './MainPageProfileStGame'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

const GAME: SteamGameProgress = {
  ...toSteamGameProgress({ appid: 311210, name: 'Black Ops III', playtime_forever: 1200, has_community_visible_stats: true }),
  achievementsLoaded: true,
  maxPossible: 98,
  numAwarded: 21,
  pctWon: 21.43,
}

test('links the whole card to the Steam game page', () => {
  render(<MainPageProfileStGame game={GAME} playingNow={false} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/311210')
})

test('is labelled "playing now" or "last played"', () => {
  const { rerender } = render(<MainPageProfileStGame game={GAME} playingNow />)
  expect(screen.getByText(en.profileRa.playingNow)).toBeInTheDocument()

  rerender(<MainPageProfileStGame game={GAME} playingNow={false} />)
  expect(screen.getByText(en.steam.lastPlayed)).toBeInTheDocument()
})

test('shows cover, title and playtime', () => {
  const { container } = render(<MainPageProfileStGame game={GAME} playingNow={false} />)
  expect(container.querySelector('img')?.getAttribute('src')).toContain('/311210/library_600x900.jpg')
  expect(screen.getByText('Black Ops III')).toBeInTheDocument()
  expect(screen.getByText(`Steam · ${en.steam.playtime}: 20 h`)).toBeInTheDocument()
})

test('shows progress with a labelled bar once counts are known', () => {
  render(<MainPageProfileStGame game={GAME} playingNow={false} />)
  expect(screen.getByText('21%')).toBeInTheDocument()
  expect(screen.getByText('21 / 98')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Black Ops III' })).toBeInTheDocument()
})

test('shows no bar without counts', () => {
  render(<MainPageProfileStGame game={{ ...GAME, achievementsLoaded: false }} playingNow={false} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
