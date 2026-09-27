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
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', rausername: 'Ivan' } } })
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menuitem', { name: 'Playing' })).toHaveAttribute('href', '/playing')
  expect(screen.getByRole('menuitem', { name: 'Want to play' })).toHaveAttribute('href', '/wantToPlay')
  expect(screen.getByRole('menuitem', { name: 'Completed' })).toHaveAttribute('href', '/completed')
})

test('Status dropdown links use the real routes when signed in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, steamid: '765' } } })
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(screen.getByRole('menuitem', { name: 'Playing' })).toHaveAttribute('href', '/playing')
})

describe('with no platform linked', () => {
  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null } } })
  })

  test('drops the parts that lead nowhere: search and the game sections', () => {
    render(<MainHeader />)
    expect(screen.queryByRole('button', { name: 'Status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Groups' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Search games' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })

  test('keeps the way home and the way to the account', () => {
    render(<MainHeader />)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()
  })

  test('typing no longer opens a search over nothing', () => {
    render(<MainHeader />)
    fireEvent.keyDown(document, { key: 'a' })
    expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument()
  })
})
