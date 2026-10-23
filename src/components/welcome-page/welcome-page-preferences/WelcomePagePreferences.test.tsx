import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import WelcomePagePreferences from './WelcomePagePreferences'

const mockChoose = jest.fn()
jest.mock('@/hooks/useThemeChoice', () => ({ useThemeChoice: () => ({ theme: 'dark', choose: mockChoose, saveError: mockSaveError() }) }))
const mockSaveError = jest.fn(() => false)
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: () => ({ me: { showInRankings: true }, setShowInRankings: jest.fn() }) }))

const T = en.welcome
const setLang = jest.fn()

function renderStep(fromBrowser = true) {
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang, T: en, fromBrowser })
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePagePreferences {...props} direction="none" focusTitle={false} />)
  return props
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSaveError.mockReturnValue(false)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { profilePublic: true, showPresence: false } }, update: jest.fn() })
})

test('the language is the browser’s until picked, in a list of their own names', () => {
  renderStep(true)
  const select = screen.getByLabelText(en.userConfig.language)
  expect(screen.getByText(T.prefs.detected)).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument()
  fireEvent.change(select, { target: { value: 'es' } })
  expect(setLang).toHaveBeenCalledWith('es')
})

test('says when it was the person who chose it', () => {
  renderStep(false)
  expect(screen.getByText(T.prefs.chosen)).toBeInTheDocument()
})

test('a theme applies at once; a failed save is said in place', async () => {
  renderStep()
  fireEvent.click(screen.getByRole('radio', { name: /Gruvbox/ }))
  expect(mockChoose).toHaveBeenCalledWith('gruvbox')
})

test('the save error shows', () => {
  mockSaveError.mockReturnValue(true)
  renderStep()
  expect(screen.getByRole('alert')).toHaveTextContent(en.userTheme.saveError)
})

test('the three privacy switches, as on the account page', () => {
  renderStep()
  expect(screen.getByRole('switch', { name: en.userData.profilePublic })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('switch', { name: en.userData.showPresence })).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByRole('switch', { name: en.rankings.showInRankings })).toBeInTheDocument()
})

test('all themes opens the full picker; next and skip', async () => {
  const { onNext, onSkip } = renderStep()
  fireEvent.click(screen.getByRole('button', { name: T.prefs.allThemes }))
  await waitFor(() => expect(screen.getAllByRole('radiogroup').length).toBeGreaterThan(1))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${T.next}`) }))
  fireEvent.click(screen.getByRole('button', { name: T.skipStep }))
  expect(onNext).toHaveBeenCalled()
  expect(onSkip).toHaveBeenCalled()
})
