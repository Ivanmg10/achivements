jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))

import { act, renderHook } from '@testing-library/react'
import { MainPlatformProvider, useMainPlatform } from './MainPlatformContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <MainPlatformProvider>{children}</MainPlatformProvider>
}

function steamLinked(isLinked: boolean) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked })
}

beforeEach(() => {
  window.localStorage.clear()
  steamLinked(true)
})

test('throws when used outside the provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => renderHook(() => useMainPlatform())).toThrow('useMainPlatform must be used inside MainPlatformProvider')
  spy.mockRestore()
})

test('defaults to RA', () => {
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  expect(result.current.platform).toBe('ra')
})

test('switches platform and remembers the choice under the tabs’ original key', () => {
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  act(() => result.current.setPlatform('steam'))
  expect(result.current.platform).toBe('steam')
  expect(window.localStorage.getItem('main-profile-tab')).toBe('steam')
})

test('reads a previously stored choice on mount', () => {
  window.localStorage.setItem('main-profile-tab', 'steam')
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  expect(result.current.platform).toBe('steam')
})

test('stays on RA without a linked Steam account, even if Steam was stored', () => {
  steamLinked(false)
  window.localStorage.setItem('main-profile-tab', 'steam')
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  expect(result.current.platform).toBe('ra')
})
