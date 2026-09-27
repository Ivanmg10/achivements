import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavoritesSteamRow from './MainPageFavoritesSteamRow'
import { en } from '@/translations/en'

function fav(snapshot: Record<string, unknown> = {}) {
  return {
    source: 'steam' as const, steam_apiname: 'WIN', game_id: 620, game_title: 'Portal 2', num_distinct_players: 0,
    snapshot: { title: 'Win', badgeUrl: 'https://cdn/win.jpg', earned: true, hidden: false, globalPct: 12.34, ...snapshot },
  } as never
}

test('links to the achievement on the Steam game page, with its rarity instead of points', () => {
  render(<MainPageFavoritesSteamRow fav={fav()} onUnpin={jest.fn()} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/620#ach-WIN')
  expect(screen.getByText(`12.3${en.achievement.haveIt}`)).toBeInTheDocument()
  expect(screen.getByText(`Portal 2 · ${en.steam.earned}`)).toBeInTheDocument()
})

test('keeps a locked hidden achievement concealed, and has no rarity when Steam gives none', () => {
  render(<MainPageFavoritesSteamRow fav={fav({ hidden: true, earned: false, globalPct: null, badgeUrl: '' })} onUnpin={jest.fn()} />)
  expect(screen.getByText(en.steam.hiddenAchievement)).toBeInTheDocument()
  expect(screen.getByText(`Portal 2 · ${en.steam.locked}`)).toBeInTheDocument()
  expect(screen.queryByText(new RegExp(en.achievement.haveIt))).not.toBeInTheDocument()
})

test('the star unpins it', () => {
  const onUnpin = jest.fn()
  render(<MainPageFavoritesSteamRow fav={fav()} onUnpin={onUnpin} />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})
