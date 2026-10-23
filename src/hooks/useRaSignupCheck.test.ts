import { act, renderHook } from '@testing-library/react'
import { useRaSignupCheck } from './useRaSignupCheck'
import { en } from '@/translations/en'

function answer(ok: boolean, body: object) {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body })
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('an accepted key gives back the account, RA\'s name and picture', async () => {
  answer(true, { user: 'PalmeraMiami', avatar: 'https://media.retroachievements.org/UserPic/PalmeraMiami.png' })
  const { result } = renderHook(() => useRaSignupCheck())

  let found = null
  await act(async () => {
    found = await result.current.check('palmeramiami', 'key')
  })

  expect(found).toEqual({ username: 'palmeramiami', apiKey: 'key', user: 'PalmeraMiami', avatar: 'https://media.retroachievements.org/UserPic/PalmeraMiami.png' })
  expect(global.fetch).toHaveBeenCalledWith('/api/auth/ra/check', expect.objectContaining({ method: 'POST', body: '{"username":"palmeramiami","apiKey":"key"}' }))
  expect(result.current.error).toBeNull()
  expect(result.current.checking).toBe(false)
})

test.each([
  ['ra-invalid', en.raLoginModal.invalid],
  ['key-in-use', en.raLoginModal.keyInUse],
  ['too-many', en.registerForm.raTooMany],
  ['ra-unavailable', en.registerForm.raUnavailable],
  ['weird', en.raLoginModal.error],
])('%s is explained', async (code, message) => {
  answer(false, { error: code })
  const { result } = renderHook(() => useRaSignupCheck())
  await act(async () => {
    expect(await result.current.check('a', 'b')).toBeNull()
  })
  expect(result.current.error).toBe(message)
  act(() => result.current.clearError())
  expect(result.current.error).toBeNull()
})

test('a network failure says so too', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useRaSignupCheck())
  await act(async () => {
    await result.current.check('a', 'b')
  })
  expect(result.current.error).toBe(en.raLoginModal.error)
})
