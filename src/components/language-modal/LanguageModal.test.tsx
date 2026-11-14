import { render, screen, fireEvent } from '@testing-library/react'
import LanguageModal from './LanguageModal'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'

const setLang = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'es', setLang, T: en })
})

test('renders nothing while closed', () => {
  render(<LanguageModal isOpen={false} onClose={jest.fn()} />)
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
})

test('offers the nine languages as one labelled radio group, the current one checked', () => {
  render(<LanguageModal isOpen onClose={jest.fn()} />)
  const radios = screen.getAllByRole('radio')
  expect(screen.getByRole('group', { name: en.userConfig.language })).toBeInTheDocument()
  expect(radios).toHaveLength(9)
  expect(screen.getByRole('radio', { name: /Español/ })).toBeChecked()
  expect(radios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1)
})

test("each option is the language's own name, with no country code or flag (#132)", () => {
  render(<LanguageModal isOpen onClose={jest.fn()} />)
  expect(screen.getAllByRole('radio').map((r) => r.closest('label')!.textContent)).toEqual(['English', 'Español', 'Português', 'Français', 'Deutsch', 'Italiano', 'Русский', 'Polski', '日本語'])
})

test('choosing one only marks it: nothing is set (an arrow key would set every language it passes) until Save', () => {
  const onClose = jest.fn()
  render(<LanguageModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /日本語/ }))
  expect(screen.getByRole('radio', { name: /日本語/ })).toBeChecked()
  expect(setLang).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
})

test('Save sets the language and closes', () => {
  const onClose = jest.fn()
  render(<LanguageModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /日本語/ }))
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.save }))
  expect(setLang).toHaveBeenCalledWith('ja')
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('Cancel closes without setting anything', () => {
  const onClose = jest.fn()
  render(<LanguageModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /日本語/ }))
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.cancel }))
  expect(setLang).not.toHaveBeenCalled()
  expect(onClose).toHaveBeenCalled()
})
