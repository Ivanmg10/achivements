jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({ ...jest.requireActual('@/lib/xboxClient'), xboxTitlesWithCompletion: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { XboxError, xboxTitlesWithCompletion } from '@/lib/xboxClient'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const call = async () => {
  const res = await GET()
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  ;(xboxTitlesWithCompletion as jest.Mock).mockResolvedValue([xboxGameFixture()])
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})

test('403 for a non-admin and 400 with no account linked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: '7', xboxxuid: '25354', xboxgamertag: 'x' } })
  expect((await call()).status).toBe(403)
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true } })
  expect((await call()).status).toBe(400)
  expect(xboxTitlesWithCompletion).not.toHaveBeenCalled()
})

test("the linked account's library", async () => {
  expect(await call()).toEqual({ status: 200, body: [xboxGameFixture()] })
  expect(xboxTitlesWithCompletion).toHaveBeenCalledWith('25354', '7')
})

test('failures are structured', async () => {
  ;(xboxTitlesWithCompletion as jest.Mock).mockRejectedValueOnce(new XboxError('not-configured', 'x'))
  expect(await call()).toEqual({ status: 503, body: { error: 'not-configured' } })
  ;(xboxTitlesWithCompletion as jest.Mock).mockRejectedValueOnce(new Error('boom'))
  expect((await call()).status).toBe(502)
})
