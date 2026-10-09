import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSaveProfileField } from './useSaveProfileField'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const update = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: null, update })
})

test('posts the field, refreshes the session and toasts', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  const { result } = renderHook(() => useSaveProfileField())
  let ok = false
  await act(async () => { ok = await result.current.save('gender', 'neutral') })
  expect(ok).toBe(true)
  expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ field: 'gender', value: 'neutral' })
  expect(update).toHaveBeenCalled()
  expect(notify.success).toHaveBeenCalledWith(en.toast.saved)
})

test('a rejected save returns false and keeps the server message', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Too long' }) })
  const { result } = renderHook(() => useSaveProfileField())
  let ok = true
  await act(async () => { ok = await result.current.save('description', 'x') })
  expect(ok).toBe(false)
  expect(result.current.error).toBe('Too long')
  expect(update).not.toHaveBeenCalled()
})

test('a network failure is reported, not thrown', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useSaveProfileField())
  await act(async () => { await result.current.save('description', 'x') })
  expect(result.current.error).toBe(en.editProfileModal.errorGeneric)
})
