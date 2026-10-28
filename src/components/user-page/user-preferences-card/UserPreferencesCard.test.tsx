import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserPreferencesCard from './UserPreferencesCard'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'

const update = jest.fn()

jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark' }) }))
jest.mock('@/components/language-modal/LanguageModal', () => ({ __esModule: true, default: () => null }))
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

const tab = (name: string | RegExp) => fireEvent.click(screen.getByRole('tab', { name }))

beforeEach(() => {
  window.localStorage.clear()
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  setUser({ location: 'ES', favorite_game: { id: 1, title: 'Zelda', imageIcon: '/z.png' } })
})

test('opens on General: theme and language, with a tab for each platform', () => {
  render(<UserPreferencesCard />)
  expect(screen.getByText(en.userPage.preferences)).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: en.userData.prefsGeneral })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByText(en.userTheme.name_dark)).toBeInTheDocument()
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([en.userData.prefsGeneral, 'RA', 'Steam', 'PlayStation'])
  expect(screen.queryByText('Zelda')).not.toBeInTheDocument()
})

test('each platform tab has its favourite, and the last tab is remembered', () => {
  const { unmount } = render(<UserPreferencesCard />)
  tab('RA')
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  tab('Steam')
  expect(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteSteamGame) })).toHaveTextContent(en.userData.notSet)
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: 'Steam' }).id)
  unmount()

  render(<UserPreferencesCard />)
  expect(screen.getByRole('tab', { name: 'Steam' })).toHaveAttribute('aria-selected', 'true')
})

test('an unknown remembered tab falls back to General', () => {
  window.localStorage.setItem('account-preferences-tab', 'bogus')
  render(<UserPreferencesCard />)
  expect(screen.getByRole('tab', { name: en.userData.prefsGeneral })).toHaveAttribute('aria-selected', 'true')
})

test('a remembered Xbox tab for someone who may not see Xbox falls back to General', () => {
  window.localStorage.setItem('account-preferences-tab', 'xbox')
  render(<UserPreferencesCard />)
  expect(screen.getByRole('tab', { name: en.userData.prefsGeneral })).toHaveAttribute('aria-selected', 'true')
  expect(screen.queryByRole('tab', { name: 'Xbox' })).not.toBeInTheDocument()
})

test('an admin gets the Xbox tab', () => {
  setUser({ admin: true })
  render(<UserPreferencesCard />)
  tab('Xbox')
  expect(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteXboxGame) })).toBeInTheDocument()
})

test('each line opens its own picker', async () => {
  render(<UserPreferencesCard />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userTheme.theme) }))
  expect(await screen.findByTestId('theme-modal')).toBeInTheDocument()
})

test('saves the Steam favourite under its own platform and refreshes the session', async () => {
  render(<UserPreferencesCard />)
  tab('Steam')
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteSteamGame) }))
  expect(await screen.findByTestId('fav-modal')).toHaveTextContent('steam')

  fireEvent.click(await screen.findByTestId('fav-modal'))

  await waitFor(() => expect(update).toHaveBeenCalledWith())
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/updateFavoriteGame')
  expect(JSON.parse(init.body)).toMatchObject({ id: 7, source: 'steam' })
})

test('saving the RA favourite keeps the RA field', async () => {
  render(<UserPreferencesCard />)
  tab('RA')
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteRaGame) }))
  fireEvent.click(await screen.findByTestId('fav-modal'))
  await waitFor(() => expect(update).toHaveBeenCalledWith())
})

test('a failed save does not touch the session', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  render(<UserPreferencesCard />)
  tab('RA')
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userPage.favoriteRaGame) }))
  fireEvent.click(await screen.findByTestId('fav-modal'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(update).not.toHaveBeenCalled()
})

test('reserves the rankings preference row while its value loads', () => {
  render(<UserPreferencesCard />)
  expect(screen.getByTestId('rankings-preference-placeholder')).toHaveClass('h-12')
})

test('the public profile switch reads the session, on unless turned off', () => {
  render(<UserPreferencesCard />)
  expect(screen.getByRole('switch', { name: en.userData.profilePublic })).toBeChecked()
})

test('sharing when you are online is on unless turned off, and says what it means', () => {
  const { unmount } = render(<UserPreferencesCard />)
  expect(screen.getByRole('switch', { name: en.userData.showPresence })).toBeChecked()
  expect(screen.getByText(en.userData.showPresenceOn)).toBeInTheDocument()
  unmount()

  setUser({ showPresence: false })
  render(<UserPreferencesCard />)
  expect(screen.getByRole('switch', { name: en.userData.showPresence })).not.toBeChecked()
  expect(screen.getByText(en.userData.showPresenceOff)).toBeInTheDocument()
})

test('whether the gender shows on the profile is offered only once there is a gender', () => {
  const { unmount } = render(<UserPreferencesCard />)
  expect(screen.queryByRole('switch', { name: en.userData.genderPublic })).not.toBeInTheDocument()
  unmount()

  setUser({ gender: 'female', genderPublic: false })
  render(<UserPreferencesCard />)
  expect(screen.getByRole('switch', { name: en.userData.genderPublic })).not.toBeChecked()
  expect(screen.getByText(en.userData.genderPublicOff)).toBeInTheDocument()
})
