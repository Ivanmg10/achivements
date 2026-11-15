jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/meBootstrap', () => ({ loadBootstrap: jest.fn() }))

import { getServerSession } from 'next-auth'
import { GET } from './route'
import { loadBootstrap } from '@/lib/meBootstrap'

const bodyOf = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => jest.clearAllMocks())

test('answers the viewer\'s own start-up data, never stored by anyone else', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 7, admin: false } })
  ;(loadBootstrap as jest.Mock).mockResolvedValue({ preferences: {}, hiddenGames: [], vault: null })
  const res = await GET()
  expect(res.status).toBe(200)
  expect(bodyOf(res)).toEqual({ preferences: {}, hiddenGames: [], vault: null })
  expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  expect(loadBootstrap).toHaveBeenCalledWith('7', false)
})

test('Xbox points count only for whoever may use Xbox', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 7, admin: true } })
  ;(loadBootstrap as jest.Mock).mockResolvedValue({ preferences: null, hiddenGames: null, vault: null })
  await GET()
  expect(loadBootstrap).toHaveBeenCalledWith('7', true)
})

test('signed out is 401 and reads nothing', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET()).status).toBe(401)
  expect(loadBootstrap).not.toHaveBeenCalled()
})
