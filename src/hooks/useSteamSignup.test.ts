import { act, renderHook, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useSteamSignup } from './useSteamSignup'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: jest.fn() }) }))

const PROFILE = { registered: false, persona: 'Gabe', avatar: null, username: 'Gabe' }

function answers(...responses: { ok: boolean; body: object }[]) {
  const fetchMock = jest.fn()
  for (const r of responses) fetchMock.mockResolvedValueOnce({ ok: r.ok, json: async () => r.body })
  global.fetch = fetchMock
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(signIn as jest.Mock).mockResolvedValue({ ok: true })
})

test('a known Steam account signs in and goes home', async () => {
  answers({ ok: true, body: { registered: true } })
  const { result } = renderHook(() => useSteamSignup('1'))

  await waitFor(() => expect(result.current.state.status).toBe('signed-in'))
  expect(signIn).toHaveBeenCalledWith('steam', { redirect: false })
  expect(mockPush).toHaveBeenCalledWith('/')
})

test('a new one gets the form', async () => {
  answers({ ok: true, body: PROFILE })
  const { result } = renderHook(() => useSteamSignup('1'))
  await waitFor(() => expect(result.current.state).toEqual({ status: 'form', profile: PROFILE }))
  expect(signIn).not.toHaveBeenCalled()
})

test('an expired ticket is an error the form can name', async () => {
  answers({ ok: false, body: { error: 'expired' } })
  const { result } = renderHook(() => useSteamSignup('1'))
  await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error: 'expired' }))
})

test('a failed callback asks nothing', () => {
  const fetchMock = answers()
  const { result } = renderHook(() => useSteamSignup('failed'))
  expect(result.current.state).toEqual({ status: 'error', error: 'failed' })
  expect(fetchMock).not.toHaveBeenCalled()
})

test('registering signs in once the account exists, and a refusal is kept to show', async () => {
  const fetchMock = answers({ ok: true, body: PROFILE }, { ok: false, body: { error: 'username-taken' } }, { ok: true, body: {} })
  const { result } = renderHook(() => useSteamSignup('1'))
  await waitFor(() => expect(result.current.state.status).toBe('form'))

  await act(() => result.current.register('gabe', 'gabe@test.com'))
  expect(result.current.submitError).toBe('username-taken')
  expect(signIn).not.toHaveBeenCalled()

  await act(() => result.current.register('gabe2', 'gabe@test.com'))
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ username: 'gabe2', email: 'gabe@test.com' })
  expect(result.current.state.status).toBe('signed-in')
})
