import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import WelcomePagePreferences from './WelcomePagePreferences'

const mockChoose = jest.fn()
const mockSaveError = jest.fn(() => false)
jest.mock('@/hooks/useThemeChoice', () => ({ useThemeChoice: () => ({ theme: 'dark', choose: mockChoose, saveError: mockSaveError() }) }))

const T = en.welcome
const setLang = jest.fn()

function renderStep(fromBrowser = true) {
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang, T: en, fromBrowser })
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  render(<WelcomePagePreferences {...props} direction="none" focusTitle={false} />)
  return props
}

const row = (name: string) => screen.getByRole('button', { name: new RegExp(`^\\d?${name}`) })

beforeEach(() => {
  jest.clearAllMocks()
  mockSaveError.mockReturnValue(false)
  localStorage.clear()
  window.history.replaceState(null, '', '/welcome')
})

test('the sample home is there beside every choice, with what each one has now', () => {
  localStorage.setItem('home-layout', 'cover')
  renderStep()
  expect(screen.getByRole('region', { name: en.homeLayout.previewLabel })).toHaveAttribute('data-layout', 'cover')
  expect(row(en.userTheme.theme)).toHaveTextContent(en.userTheme.name_dark)
  expect(row(en.homeLayout.label)).toHaveTextContent(en.homeLayout.cover)
  expect(row(en.homeLayout.shapeLabel)).toHaveTextContent(en.homeLayout.shapeSlanted)
})

test('the language says if it is the browser’s or the person’s', () => {
  renderStep(true)
  expect(row(en.userConfig.language)).toHaveTextContent(T.prefs.detected)
})

test('or chosen by them', () => {
  renderStep(false)
  expect(row(en.userConfig.language)).toHaveTextContent(T.prefs.chosen)
})

test('a row opens into its choice, one at a time, and takes the focus', () => {
  renderStep()
  fireEvent.click(row(en.homeLayout.shapeLabel))
  expect(screen.getByRole('heading', { name: en.homeLayout.shapeLabel })).toHaveFocus()
  expect(screen.getByRole('group', { name: en.homeLayout.shapeLabel })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: new RegExp(`^\\d?${en.userTheme.theme}`) })).not.toBeInTheDocument()
})

test('a shape picked applies, the sample shows it and the row says so', async () => {
  renderStep()
  fireEvent.click(row(en.homeLayout.shapeLabel))
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.homeLayout.shapeRound) }))
  expect(screen.getByRole('region', { name: en.homeLayout.previewLabel })).toHaveAttribute('data-shape', 'round')
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.close }))
  await waitFor(() => expect(row(en.homeLayout.shapeLabel)).toHaveTextContent(en.homeLayout.shapeRound))
})

test('the arrows go through the choices, and stop at the ends', () => {
  renderStep()
  fireEvent.click(row(en.userTheme.theme))
  expect(screen.getByRole('button', { name: T.prevPoint })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: T.nextPoint }))
  expect(screen.getByRole('heading', { name: en.homeLayout.shapeLabel })).toBeInTheDocument()
})

test('Escape closes it and the row gets the focus back', async () => {
  renderStep()
  fireEvent.click(row(en.homeLayout.fontLabel))
  fireEvent.keyDown(screen.getByRole('heading', { name: en.homeLayout.fontLabel }), { key: 'Escape' })
  await waitFor(() => expect(row(en.homeLayout.fontLabel)).toHaveFocus())
})

test('the language is picked from a list of their own names', () => {
  renderStep()
  fireEvent.click(row(en.userConfig.language))
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Español' }))
  expect(setLang).toHaveBeenCalledWith('es')
})

test('a theme applies at once', () => {
  renderStep()
  fireEvent.click(row(en.userTheme.theme))
  fireEvent.click(screen.getByRole('radio', { name: /Venom/ }))
  expect(mockChoose).toHaveBeenCalledWith('venom')
})

test('the theme already on is not picked again', () => {
  renderStep()
  fireEvent.click(row(en.userTheme.theme))
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.userTheme.name_dark) }))
  expect(mockChoose).not.toHaveBeenCalled()
})

test('a failed save is said in place', () => {
  mockSaveError.mockReturnValue(true)
  renderStep()
  fireEvent.click(row(en.userTheme.theme))
  expect(screen.getByRole('alert')).toHaveTextContent(en.userTheme.saveError)
})

test('the theme opens over the whole step: every theme by family, the sample beside them, and a way on', () => {
  const { onNext } = renderStep()
  fireEvent.click(row(en.userTheme.theme))
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: en.homeLayout.previewLabel })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.userTheme.group_tributes })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: /Sakura/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: T.next }))
  expect(onNext).toHaveBeenCalled()
})

test('closing the theme brings the step back with its row in focus', async () => {
  renderStep()
  fireEvent.click(row(en.userTheme.theme))
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.close }))
  await waitFor(() => expect(row(en.userTheme.theme)).toHaveFocus())
  expect(screen.getByRole('heading', { level: 1, name: T.prefs.title })).toBeInTheDocument()
})

test('nothing has to be chosen: next and skip are always there, also with a choice open', () => {
  const { onNext, onSkip } = renderStep()
  fireEvent.click(row(en.homeLayout.cardsLabel))
  fireEvent.click(screen.getByRole('button', { name: T.next }))
  fireEvent.click(screen.getByRole('button', { name: T.skipStep }))
  expect(onNext).toHaveBeenCalled()
  expect(onSkip).toHaveBeenCalled()
})
