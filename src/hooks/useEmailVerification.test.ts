import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEmailVerification } from './useEmailVerification'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

const replace = jest.fn()
const update = jest.fn()

function setup({ param = null as string | null, email = 'ivan@test.com', emailVerified = false } = {}) {
  ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => param })
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { email, emailVerified } }, update })
  return renderHook(() => useEmailVerification())
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ replace })
  ;(usePathname as jest.Mock).mockReturnValue('/user')
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('an address with no confirmation is what the notice hangs on', () => {
  expect(setup().result.current.unverified).toBe(true)
  expect(setup({ emailVerified: true }).result.current.unverified).toBe(false)
  // No address at all: there is nothing to confirm, and a different notice covers it.
  expect(setup({ email: '' }).result.current.unverified).toBe(false)
})

test('the outcome is read from the link and then cleared from the address bar', async () => {
  const { result } = setup({ param: 'verified' })

  await waitFor(() => expect(result.current.outcome).toBe('verified'))
  // Left in place, a refresh would replay the message.
  expect(replace).toHaveBeenCalledWith('/user')
  // The row changed in the database, so the session is re-read.
  expect(update).toHaveBeenCalled()
})

test('a failed outcome is reported without re-reading the session', async () => {
  const { result } = setup({ param: 'expired' })

  await waitFor(() => expect(result.current.outcome).toBe('expired'))
  expect(update).not.toHaveBeenCalled()
})

test('an unknown flag is ignored rather than shown', async () => {
  const { result } = setup({ param: 'something-else' })

  await waitFor(() => expect(replace).toHaveBeenCalled())
  expect(result.current.outcome).toBeNull()
})

test('resending asks the endpoint for nothing but a new mail', async () => {
  const { result } = setup()

  await act(async () => { await result.current.resend() })

  expect(global.fetch).toHaveBeenCalledWith('/api/auth/resendVerification', { method: 'POST' })
  expect(result.current.resendState).toBe('sent')
})

test('a refused resend is reported, not swallowed', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 })
  const { result } = setup()

  await act(async () => { await result.current.resend() })

  expect(result.current.resendState).toBe('failed')
})

test('a network failure is reported too', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  const { result } = setup()

  await act(async () => { await result.current.resend() })

  expect(result.current.resendState).toBe('failed')
})
