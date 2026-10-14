jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnClient', () => ({
  ...jest.requireActual('@/lib/psnClient'),
  findPsnGame: jest.fn(),
}))
jest.mock('@/lib/igdbClient', () => ({ igdbDetails: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { findPsnGame } from '@/lib/psnClient'
import { igdbDetails } from '@/lib/igdbClient'

const GAME = { titleId: 'NPWR00001_00', title: 'Call of Duty®: Black Ops II', consoleName: 'PS3' }
const DETAILS = { summary: 'x', developers: ['Treyarch'], publishers: [], genres: [], releaseDate: null, screenshots: [] }

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/psn/details?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.PSN_NPSSO = 'npsso'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(findPsnGame as jest.Mock).mockResolvedValue(GAME)
  ;(igdbDetails as jest.Mock).mockResolvedValue(DETAILS)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call('id=NPWR00001_00')).status).toBe(401)
})

test('400 for a malformed id, before anything is asked', async () => {
  expect(await call('id=../x')).toEqual({ status: 400, body: { error: 'invalid-title' } })
  expect(findPsnGame).not.toHaveBeenCalled()
})

test("the details of the game in the user's list, searched by Sony's title and platform", async () => {
  expect(await call('id=NPWR00001_00')).toEqual({ status: 200, body: DETAILS })
  expect(findPsnGame).toHaveBeenCalledWith('42', 'NPWR00001_00', '7')
  expect(igdbDetails).toHaveBeenCalledWith('Call of Duty®: Black Ops II', 'PS3')
})

test('404 for a game not in the list, and when IGDB has nothing', async () => {
  ;(findPsnGame as jest.Mock).mockResolvedValueOnce(null)
  expect(await call('id=NPWR00001_00')).toEqual({ status: 404, body: { error: 'not-in-library' } })
  ;(igdbDetails as jest.Mock).mockResolvedValueOnce(null)
  expect(await call('id=NPWR00001_00')).toEqual({ status: 404, body: { error: 'no-details' } })
})

test('503 when IGDB cannot be reached; 502 when Sony fails', async () => {
  ;(igdbDetails as jest.Mock).mockRejectedValueOnce(new Error('IGDB answered 500'))
  expect(await call('id=NPWR00001_00')).toEqual({ status: 503, body: { error: 'details-unavailable' } })
  ;(findPsnGame as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call('id=NPWR00001_00')).status).toBe(502)
})
