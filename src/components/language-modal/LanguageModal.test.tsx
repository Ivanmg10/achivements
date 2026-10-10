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
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
})

test('offers the nine languages as one labelled radio group, the current one checked', () => {
  render(<LanguageModal isOpen onClose={jest.fn()} />)
  const group = screen.getByRole('radiogroup', { name: en.userConfig.language })
  const radios = screen.getAllByRole('radio')
  expect(group).toBeInTheDocument()
  expect(radios).toHaveLength(9)
  expect(screen.getByRole('radio', { name: /Español/ })).toHaveAttribute('aria-checked', 'true')
  expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
})

test('choosing one sets the language and closes', () => {
  const onClose = jest.fn()
  render(<LanguageModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /日本語/ }))
  expect(setLang).toHaveBeenCalledWith('ja')
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('choosing the current one is still a choice: it closes', () => {
  const onClose = jest.fn()
  render(<LanguageModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('radio', { name: /Español/ }))
  expect(setLang).toHaveBeenCalledWith('es')
  expect(onClose).toHaveBeenCalled()
})
