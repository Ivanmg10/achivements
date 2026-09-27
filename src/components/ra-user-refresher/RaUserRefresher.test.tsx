import { render, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import RaUserRefresher from './RaUserRefresher'

jest.mock('next-auth/react')

global.fetch = jest.fn()

function mockSession(status: string, user?: object, update = jest.fn()) {
  ;(useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null, status, update })
}

beforeEach(() => {
  jest.clearAllMocks()
  // Reset module-level raRefreshed by simulating a logout cycle first
  mockSession('unauthenticated')
  render(<RaUserRefresher />)
  ;(fetch as jest.Mock).mockReset()
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ User: 'IvanXMarine' }),
  })
})

test('asks the server to refresh the stored RA profile, then re-reads the session', async () => {
  const update = jest.fn()
  mockSession('authenticated', { raUser: { User: 'IvanXMarine' } }, update)
  await act(async () => {
    render(<RaUserRefresher />)
  })
  expect(fetch).toHaveBeenCalledWith('/api/updateRaUser', { method: 'PUT' })
  expect(update).toHaveBeenCalledWith()
})

test('a failed refresh is logged and leaves the session alone', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 502 })
  const update = jest.fn()
  mockSession('authenticated', { raUser: { User: 'IvanXMarine' } }, update)
  await act(async () => {
    render(<RaUserRefresher />)
  })
  expect(console.error).toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})

test('does not fetch when authenticated but no raUser', async () => {
  mockSession('authenticated', { raUser: null })
  await act(async () => {
    render(<RaUserRefresher />)
  })
  expect(fetch).not.toHaveBeenCalled()
})

test('does not fetch when unauthenticated', async () => {
  mockSession('unauthenticated')
  await act(async () => {
    render(<RaUserRefresher />)
  })
  expect(fetch).not.toHaveBeenCalled()
})
