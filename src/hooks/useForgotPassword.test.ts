import { renderHook, act } from '@testing-library/react'
import { useForgotPassword } from './useForgotPassword'
import { en } from '@/translations/en'

const reply = (status: number, body: unknown = {}) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(() => reply(200))
})

test('sends the trimmed address and says it was sent', async () => {
  const { result } = renderHook(() => useForgotPassword())
  let ok = false
  await act(async () => { ok = await result.current.send(' a@b.c ') })
  expect(ok).toBe(true)
  expect(result.current.sent).toBe(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/auth/forgotPassword')
  expect(JSON.parse(init.body)).toEqual({ email: 'a@b.c' })
})

test.each([
  [503, { error: 'email-not-configured' }, en.passwordReset.notConfigured],
  [429, {}, en.passwordReset.tooMany],
  [500, {}, en.passwordReset.failed],
])('a %s answer is told in our words and nothing counts as sent', async (status, body, message) => {
  ;(global.fetch as jest.Mock).mockImplementation(() => reply(status, body))
  const { result } = renderHook(() => useForgotPassword())
  await act(async () => { await result.current.send('a@b.c') })
  expect(result.current.error).toBe(message)
  expect(result.current.sent).toBe(false)
  expect(result.current.submitting).toBe(false)
})

test('a network failure is the generic message, and reset starts over', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useForgotPassword())
  await act(async () => { await result.current.send('a@b.c') })
  expect(result.current.error).toBe(en.passwordReset.failed)
  act(() => result.current.reset())
  expect(result.current.error).toBe('')
})
