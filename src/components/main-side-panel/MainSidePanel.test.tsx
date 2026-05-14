global.fetch = jest.fn()

import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MainSidePanel from './MainSidePanel'
import { useSession } from 'next-auth/react'

jest.mock('@/hooks/useRecentAchievements', () => ({
  useRecentAchievements: () => ({ achievements: [] }),
}))

beforeEach(() => {
  ;(fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([]),
  })
})

test('renders categories and consoles', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainSidePanel />)
  expect(screen.getByText('Want to play')).toBeInTheDocument()
})

test('renders user welcome when raUser present', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: {
      user: {
        raUser: {
          User: 'IvanXMarine',
          UserPic: '/pic.png',
          TotalPoints: 272,
          TotalSoftcorePoints: 2202,
        },
      },
    },
  })
  render(<MainSidePanel />)
  expect(screen.getByText(/IvanXMarine/)).toBeInTheDocument()
  expect(screen.getByText('272')).toBeInTheDocument()
})

test('renders without raUser', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  })
  render(<MainSidePanel />)
  expect(screen.getByText('User settings')).toBeInTheDocument()
})

test('search filters consoles and expands categories', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainSidePanel />)
  const input = screen.getByPlaceholderText('Search console…')
  await userEvent.type(input, 'PlayStation 2')
  expect(screen.getAllByText('PlayStation 2').length).toBeGreaterThan(0)
})

test('shows no results when search matches nothing', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<MainSidePanel />)
  const input = screen.getByPlaceholderText('Search console…')
  await userEvent.type(input, 'zzzznotfound')
  expect(screen.getAllByText('No results').length).toBeGreaterThan(0)
})
