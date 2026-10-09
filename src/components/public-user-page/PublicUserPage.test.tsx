import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserPage from './PublicUserPage'
import { useCheevoUser } from '@/hooks/useCheevoUser'
import { useRaLinked } from '@/hooks/useRaLinked'
import { en } from '@/translations/en'

jest.mock('@/hooks/useCheevoUser', () => ({ useCheevoUser: jest.fn() }))
jest.mock('@/hooks/useRaLinked', () => ({ useRaLinked: jest.fn() }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)
jest.mock('@/components/subject-providers/SubjectProviders', () => ({
  __esModule: true,
  default: ({ user, children }: { user: { username: string }; children: React.ReactNode }) => (
    <div data-testid="subject" data-user={user.username}>{children}</div>
  ),
}))
jest.mock('@/components/main-page/MainPage', () => ({ MainPageBody: () => <div data-testid="main-body" /> }))
jest.mock('@/components/main-page/main-page-without-ra/MainPageWithoutRa', () => ({
  __esModule: true,
  default: () => <div data-testid="without-ra" />,
}))

const USER = { username: 'ivan', avatar: null, description: 'Hello there', location: 'ES', ra: 'IvanRA', steam: true, psn: true }
const retry = jest.fn()

function setup({ user = USER as typeof USER | null, error = null as string | null, isLoading = false, raLinked = true } = {}) {
  ;(useCheevoUser as jest.Mock).mockReturnValue({ user, isLoading, error, retry })
  ;(useRaLinked as jest.Mock).mockReturnValue(raLinked)
}

beforeEach(() => jest.clearAllMocks())

test('shows who they are, then the main page read as that user', () => {
  setup()
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByRole('heading', { name: 'ivan' })).toBeInTheDocument()
  expect(screen.getByText('Hello there')).toBeInTheDocument()
  expect(screen.getByTestId('subject')).toHaveAttribute('data-user', 'ivan')
  expect(screen.getByTestId('main-body')).toBeInTheDocument()
})

test('without readable RA, a user with Steam or PSN gets the Steam/PSN layout', () => {
  setup({ raLinked: false })
  render(<PublicUserPage username="ivan" />)
  expect(screen.queryByTestId('main-body')).not.toBeInTheDocument()
  expect(screen.getByTestId('without-ra')).toBeInTheDocument()
})

test('a user with nothing the viewer can read says so', () => {
  setup({ raLinked: false, user: { ...USER, steam: false, psn: false } })
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByText(en.publicProfile.noAccounts)).toBeInTheDocument()
})

test('an unknown user says so', () => {
  setup({ user: null, error: 'missing' })
  render(<PublicUserPage username="nobody" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userNotFound.replace('{u}', 'nobody'))
})

test('a failure offers a retry', () => {
  setup({ user: null, error: 'failed' })
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userLoadError)
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})

test('shows a loading state while the user loads', () => {
  setup({ user: null, isLoading: true })
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})
