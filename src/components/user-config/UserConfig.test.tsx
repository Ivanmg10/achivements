jest.mock('@/components/user-theme/UserTheme', () => ({
  __esModule: true,
  default: () => <div data-testid="user-theme">UserTheme</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import UserConfig from './UserConfig'

test('renders account settings section', () => {
  render(<UserConfig />)
  expect(screen.getByText('Account settings')).toBeInTheDocument()
  expect(screen.getByTestId('user-theme')).toBeInTheDocument()
})

test('renders change password button', () => {
  render(<UserConfig />)
  expect(screen.getByText('Change password')).toBeInTheDocument()
})

test('renders language switcher', () => {
  render(<UserConfig />)
  expect(screen.getByText('Language')).toBeInTheDocument()
  expect(screen.getByText('EN')).toBeInTheDocument()
  expect(screen.getByText('ES')).toBeInTheDocument()
})

test('clicking language buttons triggers setLang', () => {
  const mockSetLang = jest.fn()
  const { useLanguage } = require('@/context/LanguageContext')
  ;(useLanguage as jest.Mock).mockReturnValue({
    lang: 'en',
    setLang: mockSetLang,
    T: require('@/translations/en').en,
  })
  render(<UserConfig />)
  fireEvent.click(screen.getByText('ES'))
  expect(mockSetLang).toHaveBeenCalledWith('es')
})
