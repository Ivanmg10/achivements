import { render, screen, fireEvent } from '@testing-library/react'
import PsnPreferencesModal from './PsnPreferencesModal'
import { en } from '@/translations/en'

beforeEach(() => window.localStorage.clear())

test('shows the current choice and saves the other one, closing', () => {
  const onClose = jest.fn()
  render(<PsnPreferencesModal isOpen onClose={onClose} />)
  expect(screen.getByRole('radio', { name: en.userData.psnHiddenConceal })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: en.userData.psnHiddenReveal }))
  expect(window.localStorage.getItem('psn-hidden-trophies')).toBe('reveal')
  expect(onClose).toHaveBeenCalled()
})
