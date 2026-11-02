import { en } from '@/translations/en'
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
  fireEvent.click(screen.getByRole('button', { name: 'Library' }))
  expect(screen.getByRole('menuitem', { name: 'In progress' })).toHaveAttribute('href', '/playing')
  expect(screen.getByRole('menuitem', { name: 'No achievements' })).toHaveAttribute('href', '/wantToPlay')
  expect(screen.getByRole('menuitem', { name: 'Completed' })).toHaveAttribute('href', '/completed')
})

test('Status dropdown links use the real routes when signed in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, steamid: '765' } } })
  render(<MainHeader />)
  fireEvent.click(screen.getByRole('button', { name: 'Library' }))
  expect(screen.getByRole('menuitem', { name: 'In progress' })).toHaveAttribute('href', '/playing')
})

test('who you follow is one click away in the bar', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, steamid: '765' } } })
  render(<MainHeader />)
  expect(screen.getByRole('link', { name: en.following.title })).toHaveAttribute('href', '/following')
})

test('PSN alone is a platform: search and the sections are there', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, psnaccountid: '123' } } })
  render(<MainHeader />)
  expect(screen.getByRole('button', { name: 'Library' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.following.title })).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'Search games' }).length).toBeGreaterThan(0)
})

test('Xbox alone counts only for who may see Xbox', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, xboxxuid: '9', admin: false } } })
  const { unmount } = render(<MainHeader />)
  expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument()
  unmount()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null, xboxxuid: '9', admin: true } } })
  render(<MainHeader />)
  expect(screen.getByRole('button', { name: 'Library' })).toBeInTheDocument()
})

describe('with no platform linked', () => {
  test('the account stays on the right, with no search bar to push it there', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan' } } })
    render(<MainHeader />)
    const right = screen.getByRole('link', { name: en.sidePanel.userSettings }).parentElement
    expect(right?.className).toContain('ml-auto')
    expect(right?.className).not.toContain('lg:ml-0')
  })

  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', avatar: null } } })
  })

  test('drops the parts that lead nowhere: search and the game sections', () => {
    render(<MainHeader />)
    expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Groups' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Search games' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })

  test('keeps the way home and the way to the account', () => {
    render(<MainHeader />)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.sidePanel.userSettings })).toBeInTheDocument()
  })

  test('typing no longer opens a search over nothing', () => {
    render(<MainHeader />)
    fireEvent.keyDown(document, { key: 'a' })
    expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument()
  })
})

test('while the session loads, holds the place of the avatar instead of flashing Sign in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })
  render(<MainHeader />)
  expect(screen.queryByText('Sign in')).not.toBeInTheDocument()
})

test('the streak page is always one click away, even with no streak going', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Ivan', rausername: 'Ivan' } } })
  render(<MainHeader />)
  const link = screen.getByRole('link', { name: new RegExp(`^${en.streak.title}:`) })
  expect(link).toHaveAttribute('href', '/racha')
})
