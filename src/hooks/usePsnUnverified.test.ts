import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnUnverified } from './usePsnUnverified'

const as = (user: Record<string, unknown> | null) => (useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null })

test.each([
  ['signed out', null, false],
  ['no PSN account', { id: '7' }, false],
  ['linked, not verified', { id: '7', psnaccountid: '42' }, true],
  ['linked and verified', { id: '7', psnaccountid: '42', psnVerified: true }, false],
])('%s', (_name, user, expected) => {
  as(user)
  expect(renderHook(() => usePsnUnverified()).result.current).toBe(expected)
})
