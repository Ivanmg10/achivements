import { render, screen, fireEvent } from '@testing-library/react'
import PsnPreferencesModal from './PsnPreferencesModal'
import { en } from '@/translations/en'

beforeEach(() => window.localStorage.clear())

test('both choices start on their defaults and save independently', () => {
  render(<PsnPreferencesModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('radio', { name: en.userData.psnPlatinumOff })).toBeChecked()
  expect(screen.getByRole('radio', { name: en.userData.psnHiddenConceal })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: en.userData.psnHiddenReveal }))
  expect(window.localStorage.getItem('psn-hidden-trophies')).toBe('reveal')
  expect(window.localStorage.getItem('psn-completion')).toBeNull()
  fireEvent.click(screen.getByRole('radio', { name: en.userData.psnPlatinumOn }))
  expect(window.localStorage.getItem('psn-completion')).toBe('platinum')
})
