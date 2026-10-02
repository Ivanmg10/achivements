import { ADMIN_LOCKED_EVENT, adminFetch } from './adminFetch'

const reply = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  clone: () => ({ json: () => Promise.resolve(body) }),
})

test('an expired unlock tells the panel, and the response is handed back as is', async () => {
  const res = reply(403, { error: 'reauth-required' })
  global.fetch = jest.fn().mockResolvedValue(res)
  const heard = jest.fn()
  window.addEventListener(ADMIN_LOCKED_EVENT, heard)

  expect(await adminFetch('/api/admin/users')).toBe(res)
  expect(heard).toHaveBeenCalledTimes(1)
  window.removeEventListener(ADMIN_LOCKED_EVENT, heard)
})

test('any other answer, a plain 403 included, does not', async () => {
  const heard = jest.fn()
  window.addEventListener(ADMIN_LOCKED_EVENT, heard)
  global.fetch = jest.fn().mockResolvedValue(reply(403, { error: 'Forbidden' }))
  await adminFetch('/api/admin/users')
  global.fetch = jest.fn().mockResolvedValue(reply(200, []))
  await adminFetch('/api/admin/users')
  expect(heard).not.toHaveBeenCalled()
  window.removeEventListener(ADMIN_LOCKED_EVENT, heard)
})
