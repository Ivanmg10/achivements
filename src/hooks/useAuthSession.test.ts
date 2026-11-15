import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAuthSession } from './useAuthSession'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const update = jest.fn()
const session = { user: { id: '1' }, expires: '' }

test('an update of a session that exists stays signed in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: session, update })
  const { result } = renderHook(() => useAuthSession())
  expect(result.current).toEqual({ status: 'authenticated', data: session, update })
})

test('the first read, with no session yet, is still loading', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: null, update })
  expect(renderHook(() => useAuthSession()).result.current.status).toBe('loading')
})

test('signed in and signed out pass through as they are', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null, update })
  expect(renderHook(() => useAuthSession()).result.current.status).toBe('unauthenticated')
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: session, update })
  expect(renderHook(() => useAuthSession()).result.current.status).toBe('authenticated')
})
