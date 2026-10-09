import { render, waitFor } from '@testing-library/react'
import SubjectProviders from './SubjectProviders'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { usePublicUserProfile } from '@/hooks/usePublicUserProfile'

jest.mock('@/hooks/usePublicUserProfile', () => ({ usePublicUserProfile: jest.fn() }))

const USER = { username: 'bob', avatar: null, description: null, location: null, ra: 'BobRA', steam: true, psn: true }

/** Mounts the real providers and hooks, as the public page does, and records what they ask the server. */
function Consumers() {
  useGamesData()
  useSteamGamesData()
  usePsnGamesData()
  useUserRank()
  return null
}

let urls: string[]
beforeEach(() => {
  jest.clearAllMocks()
  urls = []
  ;(usePublicUserProfile as jest.Mock).mockReturnValue({ profile: { User: 'BobRA' } })
  global.fetch = jest.fn((url: string) => {
    urls.push(String(url))
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
  }) as unknown as typeof fetch
})

test('every read below the providers names the user, and none reads the viewer\'s own data', async () => {
  render(<SubjectProviders user={USER}><Consumers /></SubjectProviders>)

  await waitFor(() => expect(urls.length).toBeGreaterThanOrEqual(5))
  const api = urls.filter((u) => u.startsWith('/api/'))
  expect(api.length).toBeGreaterThan(0)
  for (const url of api) expect(url).toContain('user=bob')
  // RA, Steam and PSN were each asked for.
  expect(api.some((u) => u.startsWith('/api/getGamesCompleted'))).toBe(true)
  expect(api.some((u) => u.startsWith('/api/steam/'))).toBe(true)
  expect(api.some((u) => u.startsWith('/api/psn/titles'))).toBe(true)
  expect(api.some((u) => u.startsWith('/api/getUserRankAndScore'))).toBe(true)
})

test('platforms the user has not linked are not asked for', async () => {
  render(<SubjectProviders user={{ ...USER, steam: false, psn: false }}><Consumers /></SubjectProviders>)
  await waitFor(() => expect(urls.some((u) => u.startsWith('/api/getGamesCompleted'))).toBe(true))
  expect(urls.some((u) => u.startsWith('/api/steam/') || u.startsWith('/api/psn/'))).toBe(false)
})
