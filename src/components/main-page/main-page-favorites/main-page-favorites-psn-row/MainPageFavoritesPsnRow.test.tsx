import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavoritesPsnRow from './MainPageFavoritesPsnRow'
import { en } from '@/translations/en'

function fav(snapshot: Record<string, unknown> = {}) {
  return {
    source: 'psn' as const, psn_trophy_id: 4, game_id: 2018800, game_title: 'Astro Bot', num_distinct_players: 0,
    snapshot: { name: 'Bot Master', iconUrl: 'https://cdn/t.png', type: 'gold', earned: true, hidden: false, rarity: 8.25, ...snapshot },
  } as never
}

test('links to the trophy on the PSN game page, with its grade and rarity', () => {
  render(<MainPageFavoritesPsnRow fav={fav()} onUnpin={jest.fn()} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/psnGame/NPWR20188_00#trophy-4')
  expect(screen.getByText('Bot Master')).toBeInTheDocument()
  expect(screen.getByText(en.psn.gold)).toBeInTheDocument()
  expect(screen.getByText(`8.3${en.achievement.haveIt}`)).toBeInTheDocument()
})

test('keeps a locked hidden trophy concealed, and has no rarity when Sony gives none', () => {
  render(<MainPageFavoritesPsnRow fav={fav({ hidden: true, earned: false, rarity: null, iconUrl: '' })} onUnpin={jest.fn()} />)
  expect(screen.getByText(en.psn.hiddenTrophy)).toBeInTheDocument()
  expect(screen.queryByText(new RegExp(en.achievement.haveIt))).not.toBeInTheDocument()
})

test('the star unpins it', () => {
  const onUnpin = jest.fn()
  render(<MainPageFavoritesPsnRow fav={fav()} onUnpin={onUnpin} />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})
