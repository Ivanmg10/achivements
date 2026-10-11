import { render, screen, fireEvent } from '@testing-library/react'
import UserPsnPlatinumToggle from './UserPsnPlatinumToggle'
import { en } from '@/translations/en'

beforeEach(() => window.localStorage.clear())

test('off by default, says so, and flips and remembers on click', () => {
  render(<UserPsnPlatinumToggle />)
  const sw = screen.getByRole('switch', { name: en.userData.psnPlatinum })
  expect(sw).not.toBeChecked()
  expect(screen.getByText(en.userData.psnPlatinumOff)).toBeInTheDocument()
  fireEvent.click(sw)
  expect(sw).toBeChecked()
  expect(screen.getByText(en.userData.psnPlatinumOn)).toBeInTheDocument()
  expect(window.localStorage.getItem('psn-completion')).toBe('platinum')
})
