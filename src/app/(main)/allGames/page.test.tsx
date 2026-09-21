jest.mock('@/hooks/useAllGamesGlobal', () => ({
  useAllGamesGlobal: jest.fn(() => ({ wantToPlay: [], playing: [], completed: [], loading: false })),
}))

jest.mock('@/hooks/useGameExtraData', () => ({
  useGameExtraData: jest.fn(() => new Map()),
}))

jest.mock('@/components/no-main-header/NoMainHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}))

jest.mock('@/components/all-games-section/AllGamesSection', () => ({
  __esModule: true,
  default: ({ category }: { category: string }) => <div data-testid="ra-section">{category}</div>,
}))

jest.mock('@/components/steam/steam-category-section/SteamCategorySection', () => ({
  __esModule: true,
  default: ({ category, title }: { category: string; title: string }) => (
    <div data-testid="steam-section" data-category={category}>
      {title}
    </div>
  ),
}))

import { render, screen } from '@testing-library/react'
import AllGamesPage from './page'
import { en } from '@/translations/en'

test('pairs each RA category with its Steam counterpart, in order', () => {
  render(<AllGamesPage />)

  const sections = screen.getAllByTestId(/-section$/)
  expect(sections.map((s) => `${s.dataset.testid}:${s.dataset.category ?? s.textContent}`)).toEqual([
    'ra-section:wantToPlay',
    'steam-section:wantToPlay',
    'ra-section:playing',
    'steam-section:playing',
    'ra-section:completed',
    'steam-section:completed',
  ])
})

test('titles each Steam section with its category', () => {
  render(<AllGamesPage />)
  const titles = screen.getAllByTestId('steam-section').map((s) => s.textContent)
  expect(titles).toEqual([
    `Steam · ${en.categories.wantToPlay}`,
    `Steam · ${en.categories.playing}`,
    `Steam · ${en.categories.completed}`,
  ])
})
