import { render, screen, fireEvent } from '@testing-library/react'
import UserPsnPreferences from './UserPsnPreferences'
import { en } from '@/translations/en'

beforeEach(() => window.localStorage.clear())

test('two switches, each saving its own choice', () => {
  render(<UserPsnPreferences />)
  expect(screen.getByRole('heading', { name: en.userData.psnSection })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('switch', { name: en.userData.psnPlatinum }))
  expect(window.localStorage.getItem('psn-completion')).toBe('platinum')
  expect(window.localStorage.getItem('psn-hidden-trophies')).toBeNull()
  fireEvent.click(screen.getByRole('switch', { name: en.userData.psnHiddenTrophies }))
  expect(window.localStorage.getItem('psn-hidden-trophies')).toBe('reveal')
})
