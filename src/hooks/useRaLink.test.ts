import { act, renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import { useRaLink } from './useRaLink'

const update = jest.fn()
global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update })
  update.mockResolvedValue(null)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('posts the username and key, re-reads the session, and says it worked', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
  const { result } = renderHook(() => useRaLink())
  let ok = false
  await act(async () => {
    ok = await result.current.link('ivan', 'key')
  })
  expect(ok).toBe(true)
  expect(fetch).toHaveBeenCalledWith('/api/updateRaUser', expect.objectContaining({ method: 'POST', body: JSON.stringify({ username: 'ivan', apiKey: 'key' }) }))
  expect(update).toHaveBeenCalled()
  expect(result.current.error).toBeNull()
})

test('asks nothing with a field missing', async () => {
  const { result } = renderHook(() => useRaLink())
  await act(async () => {
    expect(await result.current.link('ivan', '')).toBe(false)
  })
  expect(fetch).not.toHaveBeenCalled()
})

test('turns RA refusing the key into its message', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'ra-invalid' }) })
  const { result } = renderHook(() => useRaLink())
  await act(async () => {
    await result.current.link('ivan', 'bad')
  })
  expect(result.current.error).toBe(en.raLoginModal.invalid)
  act(() => result.current.clearError())
  expect(result.current.error).toBeNull()
})

test('a key already linked elsewhere, an unknown code and a network failure each say so', async () => {
  const { result } = renderHook(() => useRaLink())
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'key-in-use' }) })
  await act(async () => {
    await result.current.link('a', 'b')
  })
  expect(result.current.error).toBe(en.raLoginModal.keyInUse)

  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => { throw new Error('no body') } })
  await act(async () => {
    await result.current.link('a', 'b')
  })
  expect(result.current.error).toBe(en.raLoginModal.error)

  ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    expect(await result.current.link('a', 'b')).toBe(false)
  })
  expect(result.current.error).toBe(en.raLoginModal.error)
  expect(result.current.isLinking).toBe(false)
})
