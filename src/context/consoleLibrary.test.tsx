import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { PsnGamesDataProvider, usePsnGamesData } from './PsnGamesDataContext'
import { XboxGamesDataProvider, useXboxGamesData } from './XboxGamesDataContext'

const PLATFORMS = [
  { name: 'PSN', Provider: PsnGamesDataProvider, useData: usePsnGamesData, url: '/api/psn/titles', user: { id: '7', psnaccountid: '9' }, console: 'PS5' },
  { name: 'Xbox', Provider: XboxGamesDataProvider, useData: useXboxGamesData, url: '/api/xbox/titles', user: { id: '7', admin: true, xboxxuid: '25354' }, console: 'Xbox Series' },
]

const GAMES = (console: string) => [{ id: 1, title: 'One', consoleName: console, earned: { platinum: 0 } }]

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
})

describe.each(PLATFORMS)('$name library provider', (p) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <p.Provider>{children}</p.Provider>

  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: p.user }, status: 'authenticated', update: jest.fn() })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => GAMES(p.console) })
  })

  test('asks for nothing until something reads it, then once', async () => {
    const { rerender } = renderHook(() => null, { wrapper })
    expect(global.fetch).not.toHaveBeenCalled()
    const { result } = renderHook(() => p.useData(), { wrapper })
    await waitFor(() => expect(result.current.library).toHaveLength(1))
    rerender()
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(p.url, { cache: 'no-store' })
  })

  test('a session that updates without changing the account hands readers the same value', async () => {
    const { result, rerender } = renderHook(() => p.useData(), { wrapper })
    await waitFor(() => expect(result.current.library).toHaveLength(1))
    const before = result.current
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { ...p.user } }, status: 'authenticated', update: jest.fn() })
    act(() => rerender())
    expect(result.current.library).toBe(before.library)
    expect(result.current.consoles).toBe(before.consoles)
    expect(result.current.refetch).toBe(before.refetch)
  })

  test('the games of the console list name their console once', async () => {
    const { result } = renderHook(() => p.useData(), { wrapper })
    await waitFor(() => expect(result.current.consoles.length).toBeGreaterThan(0))
    expect(result.current.consoles.filter((c) => c.name === p.console)).toEqual([{ name: p.console, count: 1 }])
  })
})
