import { act, renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'
import { resizeToAvatar } from '@/lib/resizeAvatar'
import { useAvatarUpload } from './useAvatarUpload'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/lib/resizeAvatar', () => {
  class AvatarReadError extends Error {}
  return { AvatarReadError, resizeToAvatar: jest.fn() }
})

const fetchMock = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update: jest.fn() })
  global.fetch = fetchMock as unknown as typeof fetch
  URL.createObjectURL = jest.fn(() => 'blob:preview')
  URL.revokeObjectURL = jest.fn()
  ;(resizeToAvatar as jest.Mock).mockResolvedValue(new Blob(['x']))
})

test('nothing to save before a pick; a resize that fails for no known reason says so', async () => {
  ;(resizeToAvatar as jest.Mock).mockRejectedValueOnce(new Error('canvas'))
  const { result } = renderHook(() => useAvatarUpload())
  await act(async () => {
    expect(await result.current.save()).toBe(false)
    await result.current.pick(new File(['a'], 'a.png'))
  })
  expect(result.current.error).toBe(en.editProfileModal.errorGeneric)
  expect(result.current.picked).toBe(false)
})

test('server refusals become plain words; a network failure too', async () => {
  const { result } = renderHook(() => useAvatarUpload())
  await act(async () => {
    await result.current.pick(new File(['a'], 'a.png'))
  })
  for (const [answer, text] of [
    [{ ok: false, json: async () => ({ error: 'too-many-attempts' }) }, en.editProfileModal.errorTooMany],
    [{ ok: false, json: async () => ({ error: 'not-an-image' }) }, en.editProfileModal.errorNotImage],
    [{ ok: false, json: async () => ({ error: 'whatever' }) }, en.editProfileModal.errorGeneric],
  ] as const) {
    fetchMock.mockResolvedValueOnce(answer)
    await act(async () => {
      expect(await result.current.save()).toBe(false)
    })
    expect(result.current.error).toBe(text)
  }
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    await result.current.save()
  })
  expect(result.current.error).toBe(en.editProfileModal.errorGeneric)
  expect(result.current.busy).toBe(false)
})
