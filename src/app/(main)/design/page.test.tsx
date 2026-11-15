import { render, screen } from '@testing-library/react'
import DesignPage from './page'
import { getServerSession } from 'next-auth'
import { loadUser } from '@/lib/userRecord'
import { notFound } from 'next/navigation'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn() }))
jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))
jest.mock('@/components/design-catalog/DesignCatalog', () => ({ __esModule: true, default: () => <div data-testid="catalog" /> }))

beforeEach(() => jest.clearAllMocks())

test('an admin, read from the database, sees the catalogue', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 3 } })
  ;(loadUser as jest.Mock).mockResolvedValue({ admin: true })
  render(await DesignPage())
  expect(screen.getByTestId('catalog')).toBeInTheDocument()
  expect(loadUser).toHaveBeenCalledWith(3, { fresh: true })
})

test.each([
  ['a user who is not an admin', { user: { id: 4 } }, { admin: false }],
  ['an admin flag only in the session is not enough', { user: { id: 5, admin: true } }, { admin: null }],
  ['someone with no session', null, null],
])('%s gets the 404', async (_name, session, user) => {
  ;(getServerSession as jest.Mock).mockResolvedValue(session)
  ;(loadUser as jest.Mock).mockResolvedValue(user)
  await expect(DesignPage()).rejects.toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})
