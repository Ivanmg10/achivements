import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavoritesXboxRow from './MainPageFavoritesXboxRow'
import { en } from '@/translations/en'

function fav(snapshot: Record<string, unknown> = {}) {
  return {
    source: 'xbox' as const, xbox_achievement_id: '4', game_id: 1738914043, game_title: 'Halo', num_distinct_players: 0,
    snapshot: { id: '4', name: 'Bot Master', iconUrl: 'https://cdn/t.png', gamerscore: 50, unlocked: true, secret: false, rarity: 8.25, ...snapshot },
  } as never
}

test('links to the achievement on the Xbox game page, with its gamerscore and rarity', () => {
  render(<MainPageFavoritesXboxRow fav={fav()} onUnpin={jest.fn()} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/xboxGame/1738914043#achievement-4')
  expect(screen.getByText('Bot Master')).toBeInTheDocument()
  expect(screen.getByText('50 G')).toBeInTheDocument()
  expect(screen.getByText(`8.3${en.achievement.haveIt}`)).toBeInTheDocument()
})

test('keeps a locked secret achievement concealed, and has no rarity when Xbox gives none', () => {
  render(<MainPageFavoritesXboxRow fav={fav({ secret: true, unlocked: false, rarity: null, iconUrl: '' })} onUnpin={jest.fn()} />)
  expect(screen.getByText(en.xbox.secretAchievement)).toBeInTheDocument()
  expect(screen.queryByText(new RegExp(en.achievement.haveIt))).not.toBeInTheDocument()
})

test('the star unpins it', () => {
  const onUnpin = jest.fn()
  render(<MainPageFavoritesXboxRow fav={fav()} onUnpin={onUnpin} />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})

test('someone else page has no star', () => {
  render(<MainPageFavoritesXboxRow fav={fav()} />)
  expect(screen.queryByRole('button', { name: en.favorites.removeFavorite })).not.toBeInTheDocument()
})
