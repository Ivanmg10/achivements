jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/hooks/useXboxGameDetails', () => ({ useXboxGameDetails: () => ({ details: null, error: null }) }))
jest.mock('@/hooks/useXboxEnabled', () => ({ useXboxEnabled: jest.fn() }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}))
jest.mock('@/components/xbox/xbox-game-info-header/XboxGameInfoHeader', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="header">{game.title}</div>,
}))
jest.mock('@/components/xbox/xbox-game-info-table/XboxGameInfoTable', () => ({
  __esModule: true,
  default: ({ achievements }: { achievements: unknown[] }) => <div data-testid="table">{achievements.length}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxGamePage from './page'
import { useParams, notFound } from 'next/navigation'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const ID = '1738914043'
const GAME = xboxGameFixture({ id: 1738914043, titleId: ID, title: 'Halo' })
const retry = jest.fn()

function setup({
  id = ID,
  enabled = true,
  linked = true,
  library = [GAME] as unknown[],
  libraryLoading = false,
  achievements = { achievements: [{ id: '0' }, { id: '1' }], isLoading: false, error: null as string | null },
} = {}) {
  ;(useParams as jest.Mock).mockReturnValue({ id })
  ;(useXboxEnabled as jest.Mock).mockReturnValue(enabled)
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ isLinked: linked, library, libraryLoading })
  ;(useXboxAchievements as jest.Mock).mockReturnValue({ ...achievements, retry })
}

beforeEach(() => jest.clearAllMocks())

test('a game in the library: header, then its achievement table', () => {
  setup()
  render(<XboxGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('Halo')
  expect(screen.getByTestId('table')).toHaveTextContent('2')
  expect(useXboxAchievements).toHaveBeenCalledWith(ID)
})

test.each([
  ['a malformed id', { id: 'nope' }],
  ["a game not in the account's library", { library: [] }],
  ['someone who may not use Xbox', { enabled: false }],
])('404 for %s', (_name, overrides) => {
  setup(overrides)
  expect(() => render(<XboxGamePage />)).toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})

test('without Xbox linked, points to the account page and loads nothing', () => {
  setup({ linked: false })
  render(<XboxGamePage />)
  expect(screen.getByRole('link', { name: en.xbox.connect })).toHaveAttribute('href', '/user')
  expect(useXboxAchievements).toHaveBeenCalledWith(null)
})

test('a skeleton while the library loads', () => {
  setup({ library: [], libraryLoading: true })
  render(<XboxGamePage />)
  expect(screen.getByTestId('loading')).toBeInTheDocument()
})

test('a failed load says so and can be retried', () => {
  setup({ achievements: { achievements: [], isLoading: false, error: 'private' } })
  render(<XboxGamePage />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.achievementsError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(retry).toHaveBeenCalled()
})

test('a game without achievements says so', () => {
  setup({ achievements: { achievements: [], isLoading: false, error: null } })
  render(<XboxGamePage />)
  expect(screen.getByText(en.xbox.noAchievements)).toBeInTheDocument()
})

test('a skeleton table while the achievements load', () => {
  setup({ achievements: { achievements: [], isLoading: true, error: null } })
  render(<XboxGamePage />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})
