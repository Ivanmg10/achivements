import { fireEvent, render, screen } from '@testing-library/react'
import MainHeader from './MainHeader'
import { useSession } from 'next-auth/react'

jest.mock('@/hooks/useRecentAchievements', () => ({
  useRecentAchievements: () => ({ achievements: [] }),
}))

jest.mock('@/components/search-modal/SearchModal', () => () => null)

test('renders sign in link when no session', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainHeader />)
  expect(screen.getByText('Sign in')).toBeInTheDocument()
})

test('renders user name when session exists', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { name: 'Ivan', avatar: null } },
  })
  render(<MainHeader />)
  expect(screen.getByText('Ivan')).toBeInTheDocument()
})

test('renders home link', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainHeader />)
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
})

test('renders the Status dropdown grouping the 3 status routes', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menuitem', { name: 'Playing' })).toHaveAttribute('href', '/authPage')
  expect(screen.getByRole('menuitem', { name: 'Want to play' })).toHaveAttribute('href', '/authPage')
  expect(screen.getByRole('menuitem', { name: 'Completed' })).toHaveAttribute('href', '/authPage')
})

test('Status dropdown links use the real routes when signed in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null } } })
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menuitem', { name: 'Playing' })).toHaveAttribute('href', '/playing')
})
