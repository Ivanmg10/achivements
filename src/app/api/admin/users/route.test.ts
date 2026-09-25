jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { DELETE } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'

function del(id?: string) {
  const url = new URL('http://localhost/api/admin/users')
  if (id !== undefined) url.searchParams.set('id', id)
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3', admin: true } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 11 }] })
})

test('an admin deletes a user; everything they own goes with them', async () => {
  const res = await DELETE(del('11'))
  expect(res.status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users'), ['11'])
})

test('only admins may delete', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3', admin: false } })
  expect((await DELETE(del('11'))).status).toBe(403)
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await DELETE(del('11'))).status).toBe(403)
  expect(pool.query).not.toHaveBeenCalled()
})

test('an admin cannot delete their own account', async () => {
  expect((await DELETE(del('3'))).status).toBe(400)
  expect(pool.query).not.toHaveBeenCalled()
})

test('rejects a missing or non-numeric id', async () => {
  expect((await DELETE(del())).status).toBe(400)
  expect((await DELETE(del('abc'))).status).toBe(400)
})

test('a user who is already gone is a 404', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  expect((await DELETE(del('11'))).status).toBe(404)
})

test('a database error is a 500, not a crash', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await DELETE(del('11'))).status).toBe(500)
})
