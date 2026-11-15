import { render, screen } from '@testing-library/react'
import UserPreferencesGeneral from './UserPreferencesGeneral'
import { useSession } from 'next-auth/react'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { en } from '@/translations/en'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))
jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark' }) }))

const noop = () => {}
const renderGeneral = () =>
  render(<UserPreferencesGeneral onOpenTheme={noop} onOpenLanguage={noop} onOpenGender={noop} onOpenHidden={noop} onOpenHome={noop} />)

beforeEach(() => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} } })
})

test('hidden games: the row says the number, not "2 hidden" under "Hidden games"', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [{}, {}] })
  renderGeneral()
  expect(screen.getByRole('button', { name: `${en.userPage.hiddenGames}: 2` })).toBeInTheDocument()
})

test('hidden games: nothing hidden says so in words', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [] })
  renderGeneral()
  expect(screen.getByRole('button', { name: `${en.userPage.hiddenGames}: ${en.userPage.hiddenNone}` })).toBeInTheDocument()
})

test('theme and language are named by what they show, never "Theme: —"', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [] })
  renderGeneral()
  expect(screen.getByRole('button', { name: new RegExp(en.userTheme.name_dark) })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument()
})
