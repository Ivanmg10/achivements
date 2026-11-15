import { act, renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { useThemeChoice } from './useThemeChoice'

jest.mock('@/context/ThemeContext', () => ({ useTheme: jest.fn() }))

const setTheme = jest.fn()
const update = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  ;(useTheme as jest.Mock).mockReturnValue({ theme: 'dark', setTheme })
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, update })
  update.mockResolvedValue(null)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('shows the theme at once and saves it on the account', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
  const { result } = renderHook(() => useThemeChoice())
  let ok = false
  await act(async () => {
    ok = await result.current.choose('sakura')
  })
  expect(ok).toBe(true)
  expect(setTheme).toHaveBeenCalledWith('sakura')
  expect(fetch).toHaveBeenCalledWith('/api/updateTheme', expect.objectContaining({ body: JSON.stringify({ theme: 'sakura' }) }))
  expect(update).toHaveBeenCalled()
  expect(result.current.saveError).toBe(false)
})

test('puts the old theme back and says so when the save fails', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  const { result } = renderHook(() => useThemeChoice())
  await act(async () => {
    expect(await result.current.choose('sakura')).toBe(false)
  })
  expect(setTheme).toHaveBeenLastCalledWith('dark')
  expect(result.current.saveError).toBe(true)
})
