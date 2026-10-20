import { fetchShared } from './fetchShared'
import { fetchWithRetry } from './fetchWithRetry'

function deferred() {
  let resolve!: (r: unknown) => void
  let reject!: (e: unknown) => void
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type Reply = { ok: boolean; status: number; json: () => Promise<unknown>; clone: () => Reply }
/** A response as far as the code reads one (jsdom has no Response); each clone reads on its own. */
const reply = (body: unknown, ok = true): Reply => ({ ok, status: ok ? 200 : 500, json: async () => body, clone: () => reply(body, ok) })

beforeEach(() => {
  global.fetch = jest.fn()
})

describe('fetchShared', () => {
  test('callers asking for the same URL at once share one request, and each can read the body', async () => {
    const d = deferred()
    ;(global.fetch as jest.Mock).mockReturnValue(d.promise)
    const a = fetchShared('/api/x')
    const b = fetchShared('/api/x')
    d.resolve(reply({ n: 1 }))
    const [ra, rb] = await Promise.all([a, b])
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(await ra.json()).toEqual({ n: 1 })
    expect(await rb.json()).toEqual({ n: 1 })
  })

  test('once settled, the next call asks again', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async () => reply({ n: 1 }))
    await fetchShared('/api/x')
    await fetchShared('/api/x')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('different URLs, or a different cache mode, are different requests', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async () => reply({}))
    await Promise.all([fetchShared('/api/x'), fetchShared('/api/y'), fetchShared('/api/x', { cache: 'no-store' })])
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  test('anything but a GET goes straight through, every time', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async () => reply({}))
    await Promise.all([fetchShared('/api/x', { method: 'POST' }), fetchShared('/api/x', { method: 'post' })])
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('a failure reaches everyone who was waiting, and does not stick', async () => {
    const d = deferred()
    ;(global.fetch as jest.Mock).mockReturnValueOnce(d.promise)
    const a = fetchShared('/api/x')
    const b = fetchShared('/api/x')
    d.reject(new Error('offline'))
    await expect(a).rejects.toThrow('offline')
    await expect(b).rejects.toThrow('offline')
    ;(global.fetch as jest.Mock).mockImplementation(async () => reply({ ok: true }))
    expect((await fetchShared('/api/x')).ok).toBe(true)
  })

  test('a plain mock response without clone is handed on as it is', async () => {
    const plain = { ok: true, json: async () => ({ n: 2 }) }
    ;(global.fetch as jest.Mock).mockResolvedValue(plain)
    expect(await fetchShared('/api/x')).toBe(plain)
  })
})

describe('fetchWithRetry shares what is in flight', () => {
  test('two callers at once get one request and the same answer; a later one asks again', async () => {
    const d = deferred()
    ;(global.fetch as jest.Mock).mockReturnValueOnce(d.promise)
    const a = fetchWithRetry('/api/awards')
    const b = fetchWithRetry('/api/awards')
    d.resolve({ ok: true, status: 200, json: async () => ({ n: 1 }) })
    expect(await a).toEqual({ n: 1 })
    expect(await b).toEqual({ n: 1 })
    expect(global.fetch).toHaveBeenCalledTimes(1)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ n: 2 }) })
    expect(await fetchWithRetry('/api/awards')).toEqual({ n: 2 })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('a 4xx reaches both callers, and the next call is not stuck on it', async () => {
    const d = deferred()
    ;(global.fetch as jest.Mock).mockReturnValueOnce(d.promise)
    const a = fetchWithRetry('/api/awards')
    const b = fetchWithRetry('/api/awards')
    d.resolve({ ok: false, status: 403, json: async () => ({}) })
    await expect(a).rejects.toMatchObject({ status: 403 })
    await expect(b).rejects.toMatchObject({ status: 403 })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ fine: true }) })
    expect(await fetchWithRetry('/api/awards')).toEqual({ fine: true })
  })
})
