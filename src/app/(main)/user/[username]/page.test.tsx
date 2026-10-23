import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import { profileTeaser } from '@/lib/rankings'
import UserProfilePage, { generateMetadata } from './page'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/rankings', () => ({ profileTeaser: jest.fn() }))
jest.mock('@/components/public-user-page/PublicUserPage', () => ({
  __esModule: true,
  default: ({ username }: { username: string }) => <div data-testid="full" data-user={username} />,
}))
jest.mock('@/components/profile-teaser/ProfileTeaser', () => ({
  __esModule: true,
  default: ({ teaser }: { teaser: { username: string } }) => <div data-testid="teaser" data-user={teaser.username} />,
}))
jest.mock('@/components/public-shell/PublicShell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const session = getServerSession as jest.Mock
const teaser = profileTeaser as jest.Mock
const params = (username: string) => ({ params: Promise.resolve({ username }) })
const ANA = { username: 'Ana', avatar: null, points: 5000, split: { ra: 5000 }, completed: 1, achievements: 10 }

beforeEach(() => jest.clearAllMocks())

test('signed in, the whole profile, and no teaser is read', async () => {
  session.mockResolvedValue({ user: { id: '1' } })
  render(await UserProfilePage(params('a%20b')))
  expect(screen.getByTestId('full')).toHaveAttribute('data-user', 'a b')
  expect(teaser).not.toHaveBeenCalled()
})

test('signed out, only the teaser', async () => {
  session.mockResolvedValue(null)
  teaser.mockResolvedValue(ANA)
  render(await UserProfilePage(params('ana')))
  expect(screen.getByTestId('teaser')).toHaveAttribute('data-user', 'Ana')
  expect(screen.queryByTestId('full')).not.toBeInTheDocument()
})

test('signed out, someone not in the rankings is not found', async () => {
  session.mockResolvedValue(null)
  teaser.mockResolvedValue(null)
  await expect(UserProfilePage(params('ghost'))).rejects.toThrow('NEXT_NOT_FOUND')
})

test('a shared link previews the level and points, and nothing for anyone else', async () => {
  teaser.mockResolvedValue(ANA)
  const meta = await generateMetadata(params('ana'))
  expect(meta.title).toBe('Ana')
  expect(meta.description).toContain('5,000 Vault Points')
  teaser.mockResolvedValue(null)
  expect(await generateMetadata(params('ghost'))).toEqual({})
})
