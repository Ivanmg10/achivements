jest.mock('@/components/ra-login-modal/RaLoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="ra-modal">Modal</div> : null,
}))
jest.mock('@/components/edit-profile-modal/EditProfileModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/language-modal/LanguageModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/location-modal/LocationModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/change-password-modal/ChangePasswordModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/theme-modal/ThemeModal', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/contexts/GamesDataContext', () => ({
  useGamesData: () => ({ all: [], softcore: [], hardcore: [], inProgress: [] }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import UserData from './UserData'
import { ThemeProvider } from '@/context/ThemeContext'
import { useSession } from 'next-auth/react'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
}

const mockSession = {
  user: {
    name: 'Ivan',
    email: 'ivan@test.com',
    theme: 'dark',
    avatar: null,
    raUser: null,
  },
} as any

beforeEach(() => {
  ;(useSession as jest.Mock).mockReturnValue({ data: mockSession, update: jest.fn() })
})

test('renders user info', () => {
  render(<UserData session={mockSession} />, { wrapper: Wrapper })
  expect(screen.getByText(/Ivan/)).toBeInTheDocument()
  expect(screen.getByText(/ivan@test.com/)).toBeInTheDocument()
})

test('renders connected accounts section', () => {
  render(<UserData session={mockSession} />, { wrapper: Wrapper })
  expect(screen.getByText('Connected accounts')).toBeInTheDocument()
})

test('opens RA modal on connect button click', () => {
  render(<UserData session={mockSession} />, { wrapper: Wrapper })
  const connectBtns = screen.getAllByText('Connect')
  fireEvent.click(connectBtns[0])
  expect(screen.getByTestId('ra-modal')).toBeInTheDocument()
})

test('renders RA user info when raUser present', () => {
  const session = {
    ...mockSession,
    user: {
      ...mockSession.user,
      raUser: { User: 'IvanXMarine', UserPic: '/pic.png', ULID: 'ulid', TotalPoints: 100, TotalSoftcorePoints: 200 },
    },
  } as any
  render(<UserData session={session} />, { wrapper: Wrapper })
  expect(screen.getByText('IvanXMarine')).toBeInTheDocument()
})

test('renders without session', () => {
  render(<UserData session={null} />, { wrapper: Wrapper })
  expect(screen.queryByText('Ivan')).not.toBeInTheDocument()
})
