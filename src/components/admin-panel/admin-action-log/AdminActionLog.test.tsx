import { fireEvent, render, screen } from '@testing-library/react'
import AdminActionLog from './AdminActionLog'

const ENTRIES = [
  { id: 2, admin_username: 'boss', target_username: 'bob', action: 'update-user', detail: { field: 'email', from: 'a@x.com', to: 'b@x.com' }, created_at: '2026-10-02T10:00:00Z' },
  { id: 1, admin_username: 'boss', target_username: null, action: 'unlock', detail: null, created_at: '2026-10-02T09:00:00Z' },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(ENTRIES) })
})

test('loads nothing until opened', () => {
  render(<AdminActionLog />)
  expect(global.fetch).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Action log' })).toHaveAttribute('aria-expanded', 'false')
})

test('opened, it reads who did what to whom', async () => {
  render(<AdminActionLog />)
  fireEvent.click(screen.getByRole('button', { name: 'Action log' }))
  expect(await screen.findByText(/email: a@x.com → b@x.com/)).toBeInTheDocument()
  expect(screen.getByText(/unlocked the panel/)).toBeInTheDocument()
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/actions', undefined)
})

test('a failed load says so', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
  render(<AdminActionLog />)
  fireEvent.click(screen.getByRole('button', { name: 'Action log' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the action log')
})
