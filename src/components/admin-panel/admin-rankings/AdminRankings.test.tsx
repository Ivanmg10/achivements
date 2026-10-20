import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminRankings from './AdminRankings'
import { adminFetch } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'

jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const flagged = { username: 'ana', userId: 4, source: 'steam', gameId: 220, title: 'Half-Life 2', earned: 33, total: 33, points: 900, flag: 'suspect' }
const ok = (data: unknown) => ({ ok: true, json: async () => data })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('the balance per platform and a flagged game to review', async () => {
  ;(adminFetch as jest.Mock)
    .mockResolvedValueOnce(ok({ balance: [{ source: 'psn', users: 3, games: 40, completed: 9, perAchievement: 31, perCompleted: 1700, perUser: 9000 }], flagged: [flagged] }))
    .mockResolvedValueOnce(ok({ ok: true }))
  render(<AdminRankings />)
  expect(await screen.findByRole('rowheader', { name: 'PlayStation' })).toBeInTheDocument()
  expect(screen.getByText('1,700')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Let it count' }))
  await waitFor(() => expect(notify.success).toHaveBeenCalled())
  expect(JSON.parse((adminFetch as jest.Mock).mock.calls[1][1].body)).toEqual({ userId: 4, source: 'steam', gameId: 220, flag: 'cleared' })
  expect(screen.getByText('Counts')).toBeInTheDocument()
})

test('a failed load says so, with a retry; a failed review a toast', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  render(<AdminRankings />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the rankings')

  ;(adminFetch as jest.Mock).mockResolvedValueOnce(ok({ balance: [], flagged: [flagged] })).mockResolvedValueOnce({ ok: false, status: 500 })
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Let it count' }))
  await waitFor(() => expect(notify.error).toHaveBeenCalled())
})
