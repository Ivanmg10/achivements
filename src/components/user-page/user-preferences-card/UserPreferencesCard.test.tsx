import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserPreferencesCard from './UserPreferencesCard'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'

const update = jest.fn()

jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark' }) }))
jest.mock('@/components/language-modal/LanguageModal', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/location-modal/LocationModal', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/theme-modal/ThemeModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="theme-modal" /> : null),
}))
jest.mock('@/components/favorite-game-modal/FavoriteGameModal', () => ({
  __esModule: true,
  default: ({ isOpen, source, onSave }: { isOpen: boolean; source: string; onSave: (g: unknown) => Promise<void> }) =>
    isOpen ? (
      <button data-testid="fav-modal" onClick={() => { void onSave({ id: 7, title: 'Picked', imageIcon: '/i.png' }).catch(() => {}) }}>
        {source}
      </button>
    ) : null,
}))

function setUser(user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  setUser({ location: 'ES', favorite_game: { id: 1, title: 'Zelda', imageIcon: '/z.png' } })
})

test('lists theme, language, country and a favourite per platform', () => {
  render(<UserPreferencesCard />)
  expect(screen.getByText(en.userPage.preferences)).toBeInTheDocument()
  expect(screen.getByText('dark')).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteSteamGame) })).toHaveTextContent(
    en.userData.notSet,
  )
})

test('each line opens its own picker', () => {
  render(<UserPreferencesCard />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userTheme.theme) }))
  expect(screen.getByTestId('theme-modal')).toBeInTheDocument()
})

test('saves the Steam favourite under its own platform and refreshes the session', async () => {
  render(<UserPreferencesCard />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteSteamGame) }))
  expect(screen.getByTestId('fav-modal')).toHaveTextContent('steam')

  fireEvent.click(screen.getByTestId('fav-modal'))

  await waitFor(() => expect(update).toHaveBeenCalledWith({ favorite_steam_game: { id: 7, title: 'Picked', imageIcon: '/i.png' } }))
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/updateFavoriteGame')
  expect(JSON.parse(init.body)).toMatchObject({ id: 7, source: 'steam' })
})

test('saving the RA favourite keeps the RA field', async () => {
  render(<UserPreferencesCard />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteRaGame) }))
  fireEvent.click(screen.getByTestId('fav-modal'))
  await waitFor(() => expect(update).toHaveBeenCalledWith({ favorite_game: { id: 7, title: 'Picked', imageIcon: '/i.png' } }))
})

test('a failed save does not touch the session', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  render(<UserPreferencesCard />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteRaGame) }))
  fireEvent.click(screen.getByTestId('fav-modal'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(update).not.toHaveBeenCalled()
})
