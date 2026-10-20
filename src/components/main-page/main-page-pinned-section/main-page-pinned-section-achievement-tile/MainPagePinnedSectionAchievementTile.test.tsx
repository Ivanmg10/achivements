import { render, screen, fireEvent } from '@testing-library/react'
import MainPagePinnedSectionAchievementTile from './MainPagePinnedSectionAchievementTile'
import { en } from '@/translations/en'
import type { PinnedView } from '@/utils/pinnedView'

const view = (over: Partial<PinnedView> = {}): PinnedView => ({
  key: 'psn:1:3', source: 'psn', gameId: 2018800, gameTitle: 'Black Ops II', title: 'Back in Time', description: 'Do it',
  iconUrl: 'https://i.png', earned: true, anchor: 'trophy-3', value: 'Gold', valueClass: 'text-yellow-400', rarity: 1.5, ...over,
})

test('links to the trophy on its game page, with how it stands', () => {
  render(<MainPagePinnedSectionAchievementTile view={view()} onUnpin={jest.fn()} />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/psnGame/NPWR20188_00#trophy-3')
  expect(link).toHaveTextContent('Back in Time')
  expect(link).toHaveTextContent('Do it')
  expect(link).toHaveTextContent('Black Ops II')
  expect(link).toHaveTextContent(en.steam.earned)
  expect(link).toHaveTextContent('Gold')
  expect(link).toHaveTextContent(`1.5${en.achievement.haveIt}`)
})

test('a locked one says so in words, and its badge is greyed', () => {
  const { container } = render(<MainPagePinnedSectionAchievementTile view={view({ earned: false, rarity: null, value: null })} onUnpin={jest.fn()} />)
  expect(screen.getByText(en.steam.locked)).toBeInTheDocument()
  expect(container.querySelector('img')).toHaveClass('grayscale')
})

test('RA opens its modal instead of linking; the star unpins', () => {
  const onOpen = jest.fn()
  const onUnpin = jest.fn()
  render(<MainPagePinnedSectionAchievementTile view={view({ source: 'ra', anchor: null })} onOpen={onOpen} onUnpin={onUnpin} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Back in Time/ }))
  expect(onOpen).toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})

test('the grip, when given, sits beside the link, by the star', () => {
  render(<MainPagePinnedSectionAchievementTile view={view()} onUnpin={jest.fn()} handle={<button>grip</button>} />)
  expect(screen.getByRole('link')).not.toContainElement(screen.getByRole('button', { name: 'grip' }))
})
