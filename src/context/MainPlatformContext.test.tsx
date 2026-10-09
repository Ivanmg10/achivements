jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))

import { act, renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { MainPlatformProvider, useMainPlatform } from './MainPlatformContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <MainPlatformProvider>{children}</MainPlatformProvider>
}

function steamLinked(isLinked: boolean) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked })
}

function psnLinked(isLinked: boolean) {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ isLinked })
}

function raLinked(linked: boolean) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { raLinked: linked } } })
}

beforeEach(() => {
  window.localStorage.clear()
  raLinked(true)
  steamLinked(true)
  psnLinked(false)
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

test('offers the linked platforms as tabs, in order', () => {
  psnLinked(true)
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  expect(result.current.linked).toEqual(['ra', 'steam', 'psn'])
})

test('can switch to PSN when it is linked', () => {
  psnLinked(true)
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  act(() => result.current.setPlatform('psn'))
  expect(result.current.platform).toBe('psn')
})

test('without RA, falls back to the first linked platform', () => {
  raLinked(false)
  steamLinked(false)
  psnLinked(true)
  const { result } = renderHook(() => useMainPlatform(), { wrapper })
  expect(result.current.platform).toBe('psn')
  expect(result.current.linked).toEqual(['psn'])
})
