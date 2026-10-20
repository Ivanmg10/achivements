jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn() }))

import { renderHook } from '@testing-library/react'
import { useConsoleVisibility } from './useConsoleVisibility'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'

const unlock = (GameID: number, ConsoleName: string, Source?: 'psn' | 'xbox' | 'steam') => ({ GameID, ConsoleName, Source })

function setup({ subject = null as string | null } = {}) {
  ;(useSubject as jest.Mock).mockReturnValue(subject)
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ fullLibrary: [{ id: 10, consoleName: 'PS3' }, { id: 11, consoleName: 'PS4 · PS5' }] })
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [{ id: 20, consoleName: 'Xbox 360' }] })
}

beforeEach(() => window.localStorage.clear())

test('nothing unticked: everything counts, and nothing is being filtered', () => {
  setup()
  const { result } = renderHook(() => useConsoleVisibility())
  expect(result.current.filtering).toBe(false)
  expect(result.current.isShown(unlock(1, 'SNES'))).toBe(true)
  expect(result.current.isGameShown('psn', 10)).toBe(true)
})

test('an unlock on an unticked console is out, whichever platform it is on; Steam never is', () => {
  setup()
  window.localStorage.setItem('hidden-consoles:ra', '["SNES"]')
  window.localStorage.setItem('hidden-consoles:psn', '["PS3","PS4"]')
  window.localStorage.setItem('hidden-consoles:xbox', '["Xbox 360"]')
  const { isShown, isGameShown, filtering } = renderHook(() => useConsoleVisibility()).result.current
  expect(filtering).toBe(true)
  expect(isShown(unlock(1, 'SNES'))).toBe(false)
  expect(isShown(unlock(2, 'GameCube'))).toBe(true)
  expect(isShown(unlock(10, 'PlayStation', 'psn'))).toBe(false)
  // on PS4 and PS5, with only PS4 unticked
  expect(isShown(unlock(11, 'PlayStation', 'psn'))).toBe(true)
  expect(isShown(unlock(20, 'Xbox', 'xbox'))).toBe(false)
  expect(isShown(unlock(30, 'Steam', 'steam'))).toBe(true)
  expect(isGameShown('psn', 10)).toBe(false)
  expect(isGameShown('xbox', 20)).toBe(false)
  expect(isGameShown('xbox', 99)).toBe(true)
})

test("someone else's page is never filtered", () => {
  setup({ subject: 'someone' })
  window.localStorage.setItem('hidden-consoles:ra', '["SNES"]')
  const { result } = renderHook(() => useConsoleVisibility())
  expect(result.current.filtering).toBe(false)
  expect(result.current.isShown(unlock(1, 'SNES'))).toBe(true)
})
